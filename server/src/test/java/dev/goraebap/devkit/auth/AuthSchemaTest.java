package dev.goraebap.devkit.auth;

import static dev.goraebap.devkit.jooq.Tables.ACCOUNTS;
import static dev.goraebap.devkit.jooq.Tables.SESSIONS;
import static dev.goraebap.devkit.jooq.Tables.USERS;
import static dev.goraebap.devkit.jooq.Tables.VERIFICATIONS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.goraebap.devkit.IntegrationTestSupport;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

/**
 * 인증 스키마가 결정-0015의 불변식을 실제로 강제하는지 검증한다.
 *
 * <p>설계/데이터베이스.md §6의 대응 표가 이 테스트의 명세다. 여기서 검증하는 것은 애플리케이션
 * 로직이 아니라 <b>스키마 자체</b>다 — 구현이 실수해도 DB가 막아주는지를 본다.
 *
 * <p>특히 {@code 같은_이메일의_대기_레코드는_여럿_존재할_수_있다}는 <b>제약의 부재</b>를 고정한다.
 * 누군가 "이메일이 중복되네" 하고 유니크 제약을 추가하면 이 테스트가 실패해야 한다 — 그 제약은
 * 공격자가 남의 이메일을 선점하는 경로를 열기 때문이다.
 *
 * <p>트랜잭션으로 감싸지 않는 이유: PostgreSQL은 제약 위반이 발생하면 그 트랜잭션을 중단 상태로
 * 만들어 이후 문장이 모두 실패한다. 위반을 여러 번 검증해야 하므로 각 문장을 독립 트랜잭션으로
 * 두고, 정리는 {@code 초기화()}가 담당한다.
 *
 * <p>기대 예외가 jOOQ의 {@code IntegrityConstraintViolationException}이 아니라 Spring의
 * {@link DataIntegrityViolationException}인 이유: Spring Boot의 jOOQ 자동설정이
 * {@code SQLExceptionTranslator}를 {@code ExecuteListener}로 끼워 넣어 jOOQ 예외를 Spring의
 * {@code DataAccessException} 계층으로 번역한다. 애플리케이션이 실제로 만나는 타입이 이쪽이다.
 */
class AuthSchemaTest extends IntegrationTestSupport {

    @Autowired
    private DSLContext dsl;

    @BeforeEach
    void 초기화() {
        dsl.deleteFrom(VERIFICATIONS).execute();
        dsl.deleteFrom(SESSIONS).execute();
        dsl.deleteFrom(ACCOUNTS).execute();
        dsl.deleteFrom(USERS).execute();
    }

    @Test
    @DisplayName("AUTH-06 미검증 사용자는 저장할 수 없다 (결정-0015)")
    void 미검증_사용자는_저장할_수_없다() {
        assertThatThrownBy(() -> dsl.insertInto(USERS)
                        .set(USERS.ID, UUID.randomUUID())
                        .set(USERS.EMAIL, "a@example.com")
                        .set(USERS.EMAIL_NORMALIZED, "a@example.com")
                        .set(USERS.EMAIL_VERIFIED_AT, (OffsetDateTime) null)
                        .set(USERS.CREATED_AT, OffsetDateTime.now())
                        .set(USERS.UPDATED_AT, OffsetDateTime.now())
                        .execute())
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("AUTH-01 이메일은 계정 전체에서 유일하다 — 정규화된 값 기준")
    void 같은_이메일의_사용자를_둘_만들_수_없다() {
        사용자를_만든다("Alice@Example.com", "alice@example.com");

        assertThatThrownBy(() -> 사용자를_만든다("alice@EXAMPLE.com", "alice@example.com"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("AUTH-06 같은 이메일의 대기 레코드는 여럿 존재할 수 있다 (결정-0015 — 제약의 부재)")
    void 같은_이메일의_대기_레코드는_여럿_존재할_수_있다() {
        대기_레코드를_만든다("EMAIL_SIGNUP", "victim@example.com", null);
        대기_레코드를_만든다("EMAIL_SIGNUP", "victim@example.com", null);

        assertThat(dsl.fetchCount(VERIFICATIONS, VERIFICATIONS.TARGET_EMAIL.eq("victim@example.com")))
                .isEqualTo(2);
    }

    @Test
    @DisplayName("AUTH-06 가입 대기 레코드는 사용자 없이 존재한다 (결정-0015)")
    void 가입_대기_레코드는_사용자_없이_존재한다() {
        assertThatCode(() -> 대기_레코드를_만든다("EMAIL_SIGNUP", "new@example.com", null))
                .doesNotThrowAnyException();

        assertThat(dsl.fetchCount(VERIFICATIONS, VERIFICATIONS.USER_ID.isNull()))
                .isEqualTo(1);
    }

    @Test
    @DisplayName("AUTH-05 한 제공자 신원은 두 사용자에 붙을 수 없다")
    void 한_제공자_신원은_두_사용자에_붙을_수_없다() {
        UUID first = 사용자를_만든다("a@example.com", "a@example.com");
        UUID second = 사용자를_만든다("b@example.com", "b@example.com");

        계정을_만든다(first, "google", "google-subject-1", null);

        assertThatThrownBy(() -> 계정을_만든다(second, "google", "google-subject-1", null))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("AUTH-06 한 사용자는 같은 제공자로 두 계정을 가질 수 없다")
    void 한_사용자는_같은_제공자로_두_계정을_가질_수_없다() {
        UUID userId = 사용자를_만든다("a@example.com", "a@example.com");
        계정을_만든다(userId, "google", "google-subject-1", null);

        assertThatThrownBy(() -> 계정을_만든다(userId, "google", "google-subject-2", null))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("AUTH-06 비밀번호는 credential 계정에만 저장된다")
    void 비밀번호는_credential_계정에만_저장된다() {
        UUID userId = 사용자를_만든다("a@example.com", "a@example.com");

        assertThatThrownBy(() -> 계정을_만든다(userId, "credential", userId.toString(), null))
                .as("credential 계정에 비밀번호가 없으면 거부한다")
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThatThrownBy(() -> 계정을_만든다(userId, "google", "google-subject-1", "$2a$10$hash"))
                .as("소셜 계정에 비밀번호가 실리면 거부한다")
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("AUTH-06 사용자를 삭제하면 세션·계정·대기 레코드가 함께 삭제된다")
    void 사용자를_삭제하면_딸린_행이_함께_삭제된다() {
        UUID userId = 사용자를_만든다("a@example.com", "a@example.com");
        계정을_만든다(userId, "credential", userId.toString(), "$2a$10$hash");
        세션을_만든다(userId, "token-hash-1");
        대기_레코드를_만든다("PASSWORD_RESET", "a@example.com", userId);

        dsl.deleteFrom(USERS).where(USERS.ID.eq(userId)).execute();

        assertThat(dsl.fetchCount(ACCOUNTS)).isZero();
        assertThat(dsl.fetchCount(SESSIONS)).isZero();
        assertThat(dsl.fetchCount(VERIFICATIONS)).isZero();
    }

    @Test
    @DisplayName("AUTH-06 세션 토큰 해시는 유일하다")
    void 세션_토큰_해시는_유일하다() {
        UUID userId = 사용자를_만든다("a@example.com", "a@example.com");
        세션을_만든다(userId, "token-hash-1");

        assertThatThrownBy(() -> 세션을_만든다(userId, "token-hash-1")).isInstanceOf(DataIntegrityViolationException.class);
    }

    private UUID 사용자를_만든다(String email, String normalizedEmail) {
        UUID id = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();
        dsl.insertInto(USERS)
                .set(USERS.ID, id)
                .set(USERS.EMAIL, email)
                .set(USERS.EMAIL_NORMALIZED, normalizedEmail)
                .set(USERS.EMAIL_VERIFIED_AT, now)
                .set(USERS.CREATED_AT, now)
                .set(USERS.UPDATED_AT, now)
                .execute();
        return id;
    }

    private void 계정을_만든다(UUID userId, String provider, String providerAccountId, String passwordHash) {
        OffsetDateTime now = OffsetDateTime.now();
        dsl.insertInto(ACCOUNTS)
                .set(ACCOUNTS.ID, UUID.randomUUID())
                .set(ACCOUNTS.USER_ID, userId)
                .set(ACCOUNTS.PROVIDER, provider)
                .set(ACCOUNTS.PROVIDER_ACCOUNT_ID, providerAccountId)
                .set(ACCOUNTS.PASSWORD_HASH, passwordHash)
                .set(ACCOUNTS.CREATED_AT, now)
                .set(ACCOUNTS.UPDATED_AT, now)
                .execute();
    }

    private void 세션을_만든다(UUID userId, String tokenHash) {
        OffsetDateTime now = OffsetDateTime.now();
        dsl.insertInto(SESSIONS)
                .set(SESSIONS.ID, UUID.randomUUID())
                .set(SESSIONS.USER_ID, userId)
                .set(SESSIONS.TOKEN_HASH, tokenHash)
                .set(SESSIONS.EXPIRES_AT, now.plusDays(7))
                .set(SESSIONS.LAST_USED_AT, now)
                .set(SESSIONS.CREATED_AT, now)
                .execute();
    }

    private void 대기_레코드를_만든다(String purpose, String targetEmail, UUID userId) {
        OffsetDateTime now = OffsetDateTime.now();
        dsl.insertInto(VERIFICATIONS)
                .set(VERIFICATIONS.ID, UUID.randomUUID())
                .set(VERIFICATIONS.PURPOSE, purpose)
                .set(VERIFICATIONS.TARGET_EMAIL, targetEmail)
                .set(VERIFICATIONS.TARGET_EMAIL_RAW, targetEmail)
                .set(VERIFICATIONS.CODE_HASH, "hmac-" + UUID.randomUUID())
                .set(VERIFICATIONS.EXPIRES_AT, now.plusMinutes(10))
                .set(VERIFICATIONS.USER_ID, userId)
                .set(VERIFICATIONS.CREATED_AT, now)
                .execute();
    }
}
