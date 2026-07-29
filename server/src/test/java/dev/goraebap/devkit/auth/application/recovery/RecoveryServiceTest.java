package dev.goraebap.devkit.auth.application.recovery;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.goraebap.devkit.auth.application.session.SessionService;
import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.application.shared.SecureTokenGenerator;
import dev.goraebap.devkit.auth.domain.account.Account;
import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import dev.goraebap.devkit.auth.domain.session.Session;
import dev.goraebap.devkit.auth.domain.user.EmailAddress;
import dev.goraebap.devkit.auth.domain.user.User;
import dev.goraebap.devkit.auth.domain.verification.Verification;
import dev.goraebap.devkit.auth.domain.verification.VerificationPurpose;
import dev.goraebap.devkit.auth.support.AuthTestFixtures;
import dev.goraebap.devkit.auth.support.FakeCrypto;
import dev.goraebap.devkit.auth.support.InMemoryAuthRepositories;
import dev.goraebap.devkit.auth.support.MutableClock;
import dev.goraebap.devkit.auth.support.RecordingRecoveryMailer;
import dev.goraebap.devkit.common.BusinessException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RecoveryServiceTest {

    private static final ClientInfo CLIENT = ClientInfo.of("203.0.113.10", "test-agent");
    private static final String IP = "203.0.113.10";

    private InMemoryAuthRepositories.Users users;
    private InMemoryAuthRepositories.Accounts accounts;
    private InMemoryAuthRepositories.Sessions sessions;
    private InMemoryAuthRepositories.Verifications verifications;
    private RecordingRecoveryMailer mailer;
    private MutableClock clock;
    private RecoveryService service;

    private UUID userId;

    @BeforeEach
    void 초기화() {
        users = new InMemoryAuthRepositories.Users();
        accounts = new InMemoryAuthRepositories.Accounts();
        sessions = new InMemoryAuthRepositories.Sessions();
        verifications = new InMemoryAuthRepositories.Verifications();
        mailer = new RecordingRecoveryMailer();
        clock = AuthTestFixtures.clock();

        SessionService sessionService = new SessionService(
                users,
                accounts,
                sessions,
                FakeCrypto.tokenHasher(),
                FakeCrypto.passwordHasher(),
                new SecureTokenGenerator(),
                AuthTestFixtures.permissiveRateLimiter(),
                AuthTestFixtures.authProperties(),
                clock);
        service = new RecoveryService(
                users,
                accounts,
                sessions,
                verifications,
                sessionService,
                mailer,
                AuthTestFixtures.permissiveRateLimiter(),
                FakeCrypto.tokenHasher(),
                FakeCrypto.passwordHasher(),
                new SecureTokenGenerator(),
                AuthTestFixtures.authProperties(),
                clock);

        User user = User.register(UUID.randomUUID(), EmailAddress.of("alice@example.com"), clock.instant());
        users.save(user);
        userId = user.id();
    }

    private void 비밀번호를_설정한다() {
        accounts.save(Account.credential(
                UUID.randomUUID(), userId, FakeCrypto.passwordHasher().hash("old-password"), clock.instant()));
    }

    private void 세션을_만든다(String tokenHash) {
        sessions.save(
                Session.issue(UUID.randomUUID(), userId, tokenHash, clock.instant(), Duration.ofDays(30), null, null));
    }

    @Test
    @DisplayName("AUTH-07 이메일로 코드를 받아 새 비밀번호를 설정할 수 있다")
    void 비밀번호를_재설정한다() {
        비밀번호를_설정한다();
        UUID verificationId = service.issuePasswordReset("Alice@Example.com", IP);
        String code = mailer.last().code();

        service.completePasswordReset(verificationId, code, "new-password", IP);

        assertThat(accounts.findByUserIdAndProvider(userId, AuthProvider.CREDENTIAL))
                .hasValueSatisfying(
                        account -> assertThat(account.passwordHash()).isEqualTo("enc(new-password)"));
    }

    @Test
    @DisplayName("AUTH-07 재설정에 성공하면 그 사용자의 모든 세션이 무효화된다 — 요청한 세션 포함")
    void 재설정하면_전_세션이_무효화된다() {
        비밀번호를_설정한다();
        세션을_만든다("hash-1");
        세션을_만든다("hash-2");
        UUID verificationId = service.issuePasswordReset("alice@example.com", IP);

        service.completePasswordReset(verificationId, mailer.last().code(), "new-password", IP);

        assertThat(sessions.rows).isEmpty();
    }

    @Test
    @DisplayName("AUTH-07 재설정하면 대기 중인 이메일 변경 요청이 함께 취소된다 (pre-hijacking 변종 4)")
    void 재설정하면_대기중_이메일_변경이_취소된다() {
        비밀번호를_설정한다();
        Verification pendingEmailChange = Verification.issueForUser(
                UUID.randomUUID(),
                VerificationPurpose.EMAIL_CHANGE,
                userId,
                "attacker@example.com",
                "attacker@example.com",
                "hmac(999999)",
                clock.instant());
        verifications.save(pendingEmailChange);

        UUID verificationId = service.issuePasswordReset("alice@example.com", IP);
        service.completePasswordReset(verificationId, mailer.last().code(), "new-password", IP);

        assertThat(verifications.findByIdAndPurpose(pendingEmailChange.id(), VerificationPurpose.EMAIL_CHANGE))
                .as("대기 중이던 이메일 변경이 사라져야 한다")
                .isEmpty();
    }

    @Test
    @DisplayName("AUTH-07 재설정용 코드는 계정 복구에 통과하지 않는다 (결정-0015 §결정 8)")
    void 용도가_다른_코드는_통하지_않는다() {
        비밀번호를_설정한다();
        UUID resetId = service.issuePasswordReset("alice@example.com", IP);
        String resetCode = mailer.last().code();

        assertThatThrownBy(() -> service.completeAccountRecovery(resetId, resetCode, CLIENT))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_OTP_INVALID));
    }

    @Test
    @DisplayName("AUTH-08 복구용 코드는 비밀번호 재설정에 통과하지 않는다 — 반대 방향도 성립한다")
    void 복구_코드는_재설정에_통하지_않는다() {
        비밀번호를_설정한다();
        UUID recoveryId = service.issueAccountRecovery("alice@example.com", IP);
        String recoveryCode = mailer.last().code();

        assertThatThrownBy(() -> service.completePasswordReset(recoveryId, recoveryCode, "new-password", IP))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_OTP_INVALID));
    }

    @Test
    @DisplayName("AUTH-07 계정이 없어도 응답 형태가 같다 — 코드 대신 안내 메일이 간다")
    void 계정이_없어도_같은_형태로_응답한다() {
        UUID verificationId = service.issuePasswordReset("nobody@example.com", IP);

        assertThat(verificationId).as("식별자는 언제나 돌아온다").isNotNull();
        assertThat(mailer.last().kind()).isEqualTo("NO_ACCOUNT");
        assertThat(mailer.last().code()).isNull();
        assertThat(verifications.rows)
                .as("미끼 레코드는 만들어진다 — 없으면 시도 횟수 소진 여부로 계정 유무가 드러난다")
                .hasSize(1);
        assertThat(verifications.rows.values().iterator().next().isDecoy()).isTrue();
    }

    @Test
    @DisplayName("AUTH-07 계정이 없어도 시도 횟수가 똑같이 소진된다 — 소진 응답으로 계정을 열거할 수 없다")
    void 계정_유무를_시도_소진으로_구분할_수_없다() {
        비밀번호를_설정한다();
        UUID realId = service.issuePasswordReset("alice@example.com", IP);
        UUID decoyId = service.issuePasswordReset("nobody@example.com", IP);

        // 양쪽에 같은 횟수의 오답을 넣으면 오류 코드 열이 같아야 한다
        List<dev.goraebap.devkit.common.ErrorCode> realCodes = 다섯_번_틀린다(realId);
        List<dev.goraebap.devkit.common.ErrorCode> decoyCodes = 다섯_번_틀린다(decoyId);

        assertThat(decoyCodes).isEqualTo(realCodes);
        assertThat(realCodes).as("마지막에는 양쪽 다 시도 횟수 초과가 되어야 한다").endsWith(AuthErrorCode.AUTH_OTP_ATTEMPTS_EXCEEDED);
    }

    private List<dev.goraebap.devkit.common.ErrorCode> 다섯_번_틀린다(UUID verificationId) {
        List<dev.goraebap.devkit.common.ErrorCode> codes = new ArrayList<>();
        for (int i = 0; i < Verification.MAX_ATTEMPTS; i++) {
            codes.add(catchBusiness(() -> service.completePasswordReset(verificationId, "000000", "new-password", IP))
                    .errorCode());
        }
        return codes;
    }

    private BusinessException catchBusiness(Runnable runnable) {
        try {
            runnable.run();
        } catch (BusinessException e) {
            return e;
        }
        throw new AssertionError("BusinessException이 발생해야 한다");
    }

    @Test
    @DisplayName("AUTH-07 비밀번호 없는 소셜 전용 계정은 재설정 대신 복구로 안내한다")
    void 비밀번호가_없으면_복구로_안내한다() {
        // 비밀번호를 설정하지 않은 사용자 — 소셜 전용 계정의 상황
        UUID verificationId = service.issuePasswordReset("alice@example.com", IP);

        assertThat(verificationId).isNotNull();
        assertThat(mailer.last().kind()).isEqualTo("NO_PASSWORD");
        assertThat(verifications.rows).as("여기에도 미끼가 남는다").hasSize(1);
        assertThat(verifications.rows.values().iterator().next().isDecoy()).isTrue();
    }

    @Test
    @DisplayName("AUTH-07 재설정하면 살아 있는 복구 코드도 함께 취소된다 — 재설정 직후 되들어오는 경로를 막는다")
    void 재설정하면_대기중_복구_코드도_취소된다() {
        비밀번호를_설정한다();
        // 공격자가 메일함을 잠깐 보고 복구 코드를 받아둔 상황
        UUID recoveryId = service.issueAccountRecovery("alice@example.com", IP);
        String stolenCode = mailer.last().code();

        UUID resetId = service.issuePasswordReset("alice@example.com", IP);
        service.completePasswordReset(resetId, mailer.last().code(), "new-password", IP);

        assertThatThrownBy(() -> service.completeAccountRecovery(recoveryId, stolenCode, CLIENT))
                .as("재설정 전에 발급된 복구 코드는 더 이상 통하지 않아야 한다")
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_OTP_INVALID));
    }

    @Test
    @DisplayName("AUTH-08 복구 로그인이 일어나면 본인에게 알림 메일이 간다")
    void 복구_로그인은_알림을_보낸다() {
        UUID verificationId = service.issueAccountRecovery("alice@example.com", IP);

        service.completeAccountRecovery(verificationId, mailer.last().code(), CLIENT);

        assertThat(mailer.last().kind()).isEqualTo("RECOVERY_LOGIN_NOTICE");
    }

    @Test
    @DisplayName("AUTH-08 비밀번호 없이 이메일 코드만으로 로그인할 수 있고 세션이 새로 발급된다")
    void 복구_로그인은_세션을_새로_발급한다() {
        UUID verificationId = service.issueAccountRecovery("alice@example.com", IP);
        String code = mailer.last().code();

        RecoveryLoginResult result = service.completeAccountRecovery(verificationId, code, CLIENT);

        assertThat(result.userId()).isEqualTo(userId);
        assertThat(result.session().token()).isNotBlank();
        assertThat(sessions.findByTokenHash("hmac(" + result.session().token() + ")"))
                .isPresent();
        assertThat(result.hasPassword()).as("비밀번호가 없으므로 설정을 안내해야 한다").isFalse();
    }

    @Test
    @DisplayName("AUTH-08 비밀번호가 있는 계정으로 복구하면 설정 안내가 필요 없다")
    void 비밀번호가_있으면_안내가_필요없다() {
        비밀번호를_설정한다();
        UUID verificationId = service.issueAccountRecovery("alice@example.com", IP);

        RecoveryLoginResult result =
                service.completeAccountRecovery(verificationId, mailer.last().code(), CLIENT);

        assertThat(result.hasPassword()).isTrue();
    }

    @Test
    @DisplayName("AUTH-07 만료된 코드는 거부되고 비밀번호가 바뀌지 않는다")
    void 만료된_코드는_거부된다() {
        비밀번호를_설정한다();
        UUID verificationId = service.issuePasswordReset("alice@example.com", IP);
        String code = mailer.last().code();
        clock.advance(Verification.TTL.plus(Duration.ofSeconds(1)));

        assertThatThrownBy(() -> service.completePasswordReset(verificationId, code, "new-password", IP))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_OTP_EXPIRED));
        assertThat(accounts.findByUserIdAndProvider(userId, AuthProvider.CREDENTIAL))
                .hasValueSatisfying(
                        account -> assertThat(account.passwordHash()).isEqualTo("enc(old-password)"));
    }

    @Test
    @DisplayName("AUTH-07 코드는 1회용이다 — 같은 코드로 두 번 재설정할 수 없다")
    void 코드는_한_번만_쓸_수_있다() {
        비밀번호를_설정한다();
        UUID verificationId = service.issuePasswordReset("alice@example.com", IP);
        String code = mailer.last().code();
        service.completePasswordReset(verificationId, code, "new-password", IP);

        assertThatThrownBy(() -> service.completePasswordReset(verificationId, code, "another-password", IP))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_OTP_INVALID));
        assertThat(accounts.findByUserIdAndProvider(userId, AuthProvider.CREDENTIAL))
                .hasValueSatisfying(
                        account -> assertThat(account.passwordHash()).isEqualTo("enc(new-password)"));
    }
}
