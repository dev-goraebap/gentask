package dev.goraebap.devkit.auth;

import static dev.goraebap.devkit.jooq.Tables.ACCOUNTS;
import static dev.goraebap.devkit.jooq.Tables.SESSIONS;
import static dev.goraebap.devkit.jooq.Tables.USERS;
import static dev.goraebap.devkit.jooq.Tables.VERIFICATIONS;
import static org.assertj.core.api.Assertions.assertThat;

import dev.goraebap.devkit.IntegrationTestSupport;
import dev.goraebap.devkit.auth.domain.account.Account;
import dev.goraebap.devkit.auth.domain.account.AccountRepository;
import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import dev.goraebap.devkit.auth.domain.session.Session;
import dev.goraebap.devkit.auth.domain.session.SessionRepository;
import dev.goraebap.devkit.auth.domain.user.EmailAddress;
import dev.goraebap.devkit.auth.domain.user.User;
import dev.goraebap.devkit.auth.domain.user.UserRepository;
import dev.goraebap.devkit.auth.domain.verification.Verification;
import dev.goraebap.devkit.auth.domain.verification.VerificationCheck;
import dev.goraebap.devkit.auth.domain.verification.VerificationPurpose;
import dev.goraebap.devkit.auth.domain.verification.VerificationRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** 저장소 어댑터의 왕복(도메인 ↔ jOOQ 레코드) 검증 (설계/서버.md §9 — 통합 테스트 대상). */
class JooqAuthRepositoriesTest extends IntegrationTestSupport {

    private static final Instant NOW = Instant.parse("2026-07-28T09:00:00Z");

    @Autowired
    private DSLContext dsl;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private VerificationRepository verificationRepository;

    @BeforeEach
    void 초기화() {
        dsl.deleteFrom(VERIFICATIONS).execute();
        dsl.deleteFrom(SESSIONS).execute();
        dsl.deleteFrom(ACCOUNTS).execute();
        dsl.deleteFrom(USERS).execute();
    }

    private User savedUser(String email) {
        User user = User.register(UUID.randomUUID(), EmailAddress.of(email), NOW);
        userRepository.save(user);
        return user;
    }

    @Test
    @DisplayName("AUTH-06 사용자 왕복 — 원문과 정규화 이메일이 함께 보존된다")
    void 사용자를_저장하고_조회한다() {
        User user = savedUser("Alice@Example.com");

        assertThat(userRepository.findById(user.id())).hasValueSatisfying(found -> {
            assertThat(found.email().raw()).isEqualTo("Alice@Example.com");
            assertThat(found.email().normalized()).isEqualTo("alice@example.com");
            assertThat(found.emailVerifiedAt()).isEqualTo(NOW);
        });
        assertThat(userRepository.findByEmailNormalized("alice@example.com")).isPresent();
        assertThat(userRepository.existsByEmailNormalized("alice@example.com")).isTrue();
        assertThat(userRepository.existsByEmailNormalized("nobody@example.com")).isFalse();
    }

    @Test
    @DisplayName("AUTH-06 credential 계정 왕복 — 비밀번호 해시가 보존된다")
    void 계정을_저장하고_조회한다() {
        User user = savedUser("a@example.com");
        Account account = Account.credential(UUID.randomUUID(), user.id(), "$2a$10$hash", NOW);
        accountRepository.save(account);

        assertThat(accountRepository.findByUserIdAndProvider(user.id(), AuthProvider.CREDENTIAL))
                .hasValueSatisfying(found -> {
                    assertThat(found.passwordHash()).isEqualTo("$2a$10$hash");
                    assertThat(found.providerAccountId()).isEqualTo(user.id().toString());
                });
        assertThat(accountRepository.findByProviderAndProviderAccountId(
                        AuthProvider.CREDENTIAL, user.id().toString()))
                .isPresent();
    }

    @Test
    @DisplayName("AUTH-06 세션 왕복 — 토큰 해시 조회·슬라이딩 갱신·삭제")
    void 세션을_저장하고_갱신하고_삭제한다() {
        User user = savedUser("a@example.com");
        Session session = Session.issue(
                UUID.randomUUID(), user.id(), "token-hash-1", NOW, Duration.ofDays(30), "127.0.0.1", "agent");
        sessionRepository.save(session);

        assertThat(sessionRepository.findByTokenHash("token-hash-1")).isPresent();

        // 슬라이딩 연장을 저장하면 만료가 갱신된다
        Instant later = NOW.plus(Duration.ofHours(2));
        assertThat(session.touch(later, Duration.ofDays(30), Duration.ofHours(1)))
                .isTrue();
        sessionRepository.save(session);
        assertThat(sessionRepository.findByTokenHash("token-hash-1"))
                .hasValueSatisfying(found -> assertThat(found.expiresAt()).isEqualTo(later.plus(Duration.ofDays(30))));

        sessionRepository.deleteById(session.id());
        assertThat(sessionRepository.findByTokenHash("token-hash-1")).isEmpty();
    }

    @Test
    @DisplayName("AUTH-06 사용자의 전체 세션을 무효화할 수 있다")
    void 사용자의_전체_세션을_삭제한다() {
        User user = savedUser("a@example.com");
        sessionRepository.save(
                Session.issue(UUID.randomUUID(), user.id(), "hash-1", NOW, Duration.ofDays(30), null, null));
        sessionRepository.save(
                Session.issue(UUID.randomUUID(), user.id(), "hash-2", NOW, Duration.ofDays(30), null, null));

        sessionRepository.deleteAllByUserId(user.id());

        assertThat(dsl.fetchCount(SESSIONS)).isZero();
    }

    @Test
    @DisplayName("AUTH-06 대기 레코드 조회는 항상 용도로 필터된다 — 다른 용도로는 찾을 수 없다 (결정-0015)")
    void 대기_레코드는_용도로_필터된다() {
        Verification verification = Verification.issueSignup(UUID.randomUUID(), "a@example.com", "code-hash", NOW);
        verificationRepository.save(verification);

        assertThat(verificationRepository.findByIdAndPurpose(verification.id(), VerificationPurpose.EMAIL_SIGNUP))
                .isPresent();
        assertThat(verificationRepository.findByIdAndPurpose(verification.id(), VerificationPurpose.PASSWORD_RESET))
                .isEmpty();
    }

    @Test
    @DisplayName("AUTH-06 시도 횟수와 소진 시각이 저장을 거쳐 보존된다")
    void 시도_횟수와_소진이_보존된다() {
        Verification verification = Verification.issueSignup(UUID.randomUUID(), "a@example.com", "code-hash", NOW);
        verificationRepository.save(verification);

        assertThat(verification.attempt("wrong-hash", NOW)).isEqualTo(VerificationCheck.CODE_MISMATCH);
        verificationRepository.save(verification);
        assertThat(verificationRepository
                        .findByIdAndPurpose(verification.id(), VerificationPurpose.EMAIL_SIGNUP)
                        .orElseThrow()
                        .attempts())
                .isEqualTo(1);

        assertThat(verification.attempt("code-hash", NOW)).isEqualTo(VerificationCheck.OK);
        verificationRepository.save(verification);
        assertThat(verificationRepository
                        .findByIdAndPurpose(verification.id(), VerificationPurpose.EMAIL_SIGNUP)
                        .orElseThrow()
                        .consumedAt())
                .isEqualTo(NOW);
    }
}
