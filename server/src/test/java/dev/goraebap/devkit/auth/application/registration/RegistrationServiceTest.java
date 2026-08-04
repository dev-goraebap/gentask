package dev.goraebap.devkit.auth.application.registration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.goraebap.devkit.auth.application.session.SessionService;
import dev.goraebap.devkit.auth.application.shared.AttemptRateLimiter;
import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.application.shared.HmacPurpose;
import dev.goraebap.devkit.auth.application.shared.SecureTokenGenerator;
import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import dev.goraebap.devkit.auth.domain.user.EmailAddress;
import dev.goraebap.devkit.auth.domain.user.User;
import dev.goraebap.devkit.auth.domain.verification.Verification;
import dev.goraebap.devkit.auth.domain.verification.VerificationPurpose;
import dev.goraebap.devkit.auth.support.AuthTestFixtures;
import dev.goraebap.devkit.auth.support.FakeCrypto;
import dev.goraebap.devkit.auth.support.InMemoryAuthRepositories;
import dev.goraebap.devkit.auth.support.MutableClock;
import dev.goraebap.devkit.auth.support.RecordingSignupMailer;
import dev.goraebap.devkit.common.BusinessException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RegistrationServiceTest {

    private static final ClientInfo CLIENT = ClientInfo.of("203.0.113.10", "test-agent");

    private InMemoryAuthRepositories.Users users;
    private InMemoryAuthRepositories.Accounts accounts;
    private InMemoryAuthRepositories.Sessions sessions;
    private InMemoryAuthRepositories.Verifications verifications;
    private RecordingSignupMailer mailer;
    private MutableClock clock;
    private boolean rateLimitAllowed;
    private RegistrationService service;

    @BeforeEach
    void 초기화() {
        users = new InMemoryAuthRepositories.Users();
        accounts = new InMemoryAuthRepositories.Accounts();
        sessions = new InMemoryAuthRepositories.Sessions();
        verifications = new InMemoryAuthRepositories.Verifications();
        mailer = new RecordingSignupMailer();
        clock = AuthTestFixtures.clock();
        rateLimitAllowed = true;

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
        service = new RegistrationService(
                users,
                accounts,
                verifications,
                sessionService,
                mailer,
                new AttemptRateLimiter() {
                    @Override
                    public boolean tryAcquire(String key, int limit, Duration window) {
                        return rateLimitAllowed;
                    }

                    @Override
                    public void reset(String key) {
                        // 발급 경로는 카운터를 비우지 않는다
                    }
                },
                FakeCrypto.tokenHasher(),
                FakeCrypto.passwordHasher(),
                new SecureTokenGenerator(),
                AuthTestFixtures.authProperties(),
                clock);
    }

    @Test
    @DisplayName("AUTH-01 이메일을 입력하면 OTP가 발송되고, 이 단계에서 user 행이 생기지 않는다")
    void 발급_단계에서는_사용자가_생기지_않는다() {
        UUID verificationId = service.issueSignupVerification("New@Example.com", "203.0.113.10");

        assertThat(mailer.otpMails).hasSize(1);
        assertThat(mailer.otpMails.get(0).email()).isEqualTo("New@Example.com");
        assertThat(mailer.otpMails.get(0).code()).matches("\\d{6}");
        assertThat(users.rows).isEmpty();
        assertThat(verifications.findByIdAndPurpose(verificationId, VerificationPurpose.EMAIL_SIGNUP))
                .isPresent();
    }

    @Test
    @DisplayName("AUTH-05 기존 계정의 이메일이면 OTP 대신 안내 메일이 가고 응답 형태는 동일하다")
    void 기존_이메일이면_안내_메일이_간다() {
        users.save(User.register(UUID.randomUUID(), EmailAddress.of("old@example.com"), clock.instant()));

        UUID verificationId = service.issueSignupVerification("old@example.com", "203.0.113.10");

        assertThat(mailer.otpMails).isEmpty();
        assertThat(mailer.existingAccountGuides).containsExactly("old@example.com");
        assertThat(verificationId).isNotNull();
    }

    @Test
    @DisplayName("AUTH-01 OTP 발송은 rate limit의 대상이다 (결정-0015)")
    void 한도를_넘으면_발급을_거부한다() {
        rateLimitAllowed = false;

        assertThatThrownBy(() -> service.issueSignupVerification("new@example.com", "203.0.113.10"))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_OTP_RATE_LIMITED));
        assertThat(mailer.otpMails).isEmpty();
    }

    @Test
    @DisplayName("AUTH-01 OTP를 통과하면 user·credential 계정이 생기고 세션 토큰이 새로 발급된다")
    void 검증을_통과하면_계정과_세션이_생긴다() {
        UUID verificationId = service.issueSignupVerification("new@example.com", "203.0.113.10");
        String code = mailer.lastOtpCode();

        SignupResult result = service.completeSignup(verificationId, code, "password-1234", CLIENT);

        assertThat(users.rows).hasSize(1);
        User created = users.rows.values().iterator().next();
        assertThat(created.email().normalized()).isEqualTo("new@example.com");
        assertThat(created.emailVerifiedAt()).isEqualTo(clock.instant());

        assertThat(accounts.findByUserIdAndProvider(created.id(), AuthProvider.CREDENTIAL))
                .hasValueSatisfying(
                        account -> assertThat(account.passwordHash()).isEqualTo("enc(password-1234)"));

        assertThat(result.session().token()).isNotBlank();
        assertThat(sessions.findByTokenHash(
                        FakeCrypto.해시(HmacPurpose.SESSION, result.session().token())))
                .isPresent();
    }

    @Test
    @DisplayName("AUTH-01 OTP를 통과하지 못하면 user 행이 생기지 않고 시도 횟수가 누적된다")
    void 틀린_코드는_사용자를_만들지_않는다() {
        UUID verificationId = service.issueSignupVerification("new@example.com", "203.0.113.10");

        assertThatThrownBy(() -> service.completeSignup(verificationId, "000000", "password-1234", CLIENT))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_OTP_INVALID));

        assertThat(users.rows).isEmpty();
        assertThat(verifications
                        .findByIdAndPurpose(verificationId, VerificationPurpose.EMAIL_SIGNUP)
                        .orElseThrow()
                        .attempts())
                .isEqualTo(1);
    }

    @Test
    @DisplayName("AUTH-06 5회 실패하면 코드가 폐기된다 — 이후 올바른 코드도 거부된다 (결정-0015)")
    void 오회_실패하면_올바른_코드도_거부된다() {
        UUID verificationId = service.issueSignupVerification("new@example.com", "203.0.113.10");
        String code = mailer.lastOtpCode();
        String wrongCode = code.equals("000000") ? "000001" : "000000";

        for (int i = 0; i < Verification.MAX_ATTEMPTS - 1; i++) {
            assertThatThrownBy(() -> service.completeSignup(verificationId, wrongCode, "password-1234", CLIENT))
                    .isInstanceOf(BusinessException.class);
        }
        assertThatThrownBy(() -> service.completeSignup(verificationId, wrongCode, "password-1234", CLIENT))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_OTP_ATTEMPTS_EXCEEDED));
        assertThatThrownBy(() -> service.completeSignup(verificationId, code, "password-1234", CLIENT))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_OTP_ATTEMPTS_EXCEEDED));
        assertThat(users.rows).isEmpty();
    }

    @Test
    @DisplayName("AUTH-06 만료된 코드는 거부된다 (결정-0015)")
    void 만료된_코드는_거부된다() {
        UUID verificationId = service.issueSignupVerification("new@example.com", "203.0.113.10");
        String code = mailer.lastOtpCode();
        clock.advance(Verification.TTL.plus(Duration.ofSeconds(1)));

        assertThatThrownBy(() -> service.completeSignup(verificationId, code, "password-1234", CLIENT))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_OTP_EXPIRED));
        assertThat(users.rows).isEmpty();
    }

    @Test
    @DisplayName("AUTH-06 다른 용도로 발급된 코드는 가입에 통과하지 않는다 (결정-0015)")
    void 다른_용도의_코드는_통과하지_않는다() {
        Verification passwordReset = Verification.restore(
                UUID.randomUUID(),
                VerificationPurpose.PASSWORD_RESET,
                "new@example.com",
                "new@example.com",
                FakeCrypto.해시(HmacPurpose.OTP, "123456"),
                0,
                clock.instant().plus(Verification.TTL),
                null,
                UUID.randomUUID(),
                null,
                null,
                clock.instant());
        verifications.save(passwordReset);

        assertThatThrownBy(() -> service.completeSignup(passwordReset.id(), "123456", "password-1234", CLIENT))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_OTP_INVALID));
    }

    @Test
    @DisplayName("AUTH-01 IP 한도를 넘기면 이메일 카운터를 소비하지 않는다 — 남의 쿼터를 소진시키는 경로를 막는다")
    void ip가_거부되면_이메일_카운터를_건드리지_않는다() {
        List<String> consumed = new ArrayList<>();
        RegistrationService limited = new RegistrationService(
                users,
                accounts,
                verifications,
                new SessionService(
                        users,
                        accounts,
                        sessions,
                        FakeCrypto.tokenHasher(),
                        FakeCrypto.passwordHasher(),
                        new SecureTokenGenerator(),
                        AuthTestFixtures.permissiveRateLimiter(),
                        AuthTestFixtures.authProperties(),
                        clock),
                mailer,
                new AttemptRateLimiter() {
                    @Override
                    public boolean tryAcquire(String key, int limit, Duration window) {
                        consumed.add(key);
                        return !key.startsWith("otp:issue:ip:");
                    }

                    @Override
                    public void reset(String key) {
                        // 발급 경로는 카운터를 비우지 않는다
                    }
                },
                FakeCrypto.tokenHasher(),
                FakeCrypto.passwordHasher(),
                new SecureTokenGenerator(),
                AuthTestFixtures.authProperties(),
                clock);

        assertThatThrownBy(() -> limited.issueSignupVerification("victim@example.com", "203.0.113.10"))
                .isInstanceOf(BusinessException.class);

        assertThat(consumed).containsExactly("otp:issue:ip:203.0.113.10");
    }

    @Test
    @DisplayName("AUTH-06 대기 시도는 이메일을 예약하지 않는다 — 먼저 코드를 맞힌 쪽이 계정을 얻는다 (결정-0015)")
    void 대기_시도는_이메일을_예약하지_않는다() {
        UUID first = service.issueSignupVerification("new@example.com", "203.0.113.10");
        String firstCode = mailer.lastOtpCode();
        UUID second = service.issueSignupVerification("new@example.com", "203.0.113.99");
        String secondCode = mailer.lastOtpCode();

        service.completeSignup(second, secondCode, "password-1234", CLIENT);

        assertThatThrownBy(() -> service.completeSignup(first, firstCode, "password-5678", CLIENT))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_EMAIL_ALREADY_USED));
        assertThat(users.rows).hasSize(1);
    }
}
