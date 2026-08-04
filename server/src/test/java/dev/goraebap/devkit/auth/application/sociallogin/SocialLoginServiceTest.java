package dev.goraebap.devkit.auth.application.sociallogin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.goraebap.devkit.auth.application.session.SessionService;
import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.application.shared.SecureTokenGenerator;
import dev.goraebap.devkit.auth.domain.account.Account;
import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import dev.goraebap.devkit.auth.domain.user.EmailAddress;
import dev.goraebap.devkit.auth.domain.user.User;
import dev.goraebap.devkit.auth.domain.verification.Verification;
import dev.goraebap.devkit.auth.support.AuthTestFixtures;
import dev.goraebap.devkit.auth.support.FakeCrypto;
import dev.goraebap.devkit.auth.support.InMemoryAuthRepositories;
import dev.goraebap.devkit.auth.support.MutableClock;
import dev.goraebap.devkit.auth.support.RecordingSignupMailer;
import dev.goraebap.devkit.common.BusinessException;
import java.time.Duration;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SocialLoginServiceTest {

    private static final ClientInfo CLIENT = ClientInfo.of("203.0.113.10", "test-agent");
    private static final String IP = "203.0.113.10";
    private static final String GOOGLE_SUBJECT = "google-subject-1";

    private InMemoryAuthRepositories.Users users;
    private InMemoryAuthRepositories.Accounts accounts;
    private InMemoryAuthRepositories.Sessions sessions;
    private InMemoryAuthRepositories.Verifications verifications;
    private RecordingSignupMailer mailer;
    private MutableClock clock;
    private PendingSocialTicketCodec codec;
    private SocialLoginService service;

    @BeforeEach
    void 초기화() {
        users = new InMemoryAuthRepositories.Users();
        accounts = new InMemoryAuthRepositories.Accounts();
        sessions = new InMemoryAuthRepositories.Sessions();
        verifications = new InMemoryAuthRepositories.Verifications();
        mailer = new RecordingSignupMailer();
        clock = AuthTestFixtures.clock();
        codec = new PendingSocialTicketCodec(FakeCrypto.tokenHasher(), clock);

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
        service = new SocialLoginService(
                users,
                accounts,
                verifications,
                sessionService,
                mailer,
                AuthTestFixtures.permissiveRateLimiter(),
                codec,
                FakeCrypto.tokenHasher(),
                new SecureTokenGenerator(),
                AuthTestFixtures.authProperties(),
                clock);
    }

    private SocialIdentity 구글신원() {
        return new SocialIdentity(AuthProvider.GOOGLE, GOOGLE_SUBJECT);
    }

    private UUID 로컬가입자를_만든다(String email) {
        User user = User.register(UUID.randomUUID(), EmailAddress.of(email), clock.instant());
        users.save(user);
        accounts.save(Account.credential(
                UUID.randomUUID(), user.id(), FakeCrypto.passwordHasher().hash("password-1234"), clock.instant()));
        return user.id();
    }

    @Test
    @DisplayName("AUTH-02 이미 아는 제공자 신원이면 2단계 없이 바로 로그인된다")
    void 아는_신원은_바로_로그인된다() {
        User user = User.register(UUID.randomUUID(), EmailAddress.of("known@example.com"), clock.instant());
        users.save(user);
        accounts.save(
                Account.social(UUID.randomUUID(), user.id(), AuthProvider.GOOGLE, GOOGLE_SUBJECT, clock.instant()));

        SocialLoginOutcome outcome = service.onProviderAuthenticated(구글신원(), CLIENT);

        assertThat(outcome.status()).isEqualTo(SocialLoginOutcome.Status.SIGNED_IN);
        assertThat(outcome.userId()).isEqualTo(user.id());
        assertThat(sessions.findByTokenHash("hmac(" + outcome.session().token() + ")"))
                .isPresent();
    }

    @Test
    @DisplayName("AUTH-02 처음 보는 신원이면 이메일을 물어야 하며, 이 단계에서 계정이 생기지 않는다")
    void 처음_보는_신원은_이메일을_묻는다() {
        SocialLoginOutcome outcome = service.onProviderAuthenticated(구글신원(), CLIENT);

        assertThat(outcome.status()).isEqualTo(SocialLoginOutcome.Status.EMAIL_REQUIRED);
        assertThat(users.rows).as("소유 증명 전에는 사용자가 생기지 않는다").isEmpty();
        assertThat(accounts.rows).as("user 없이 account를 만들지 않는다").isEmpty();
    }

    @Test
    @DisplayName("AUTH-02 신규 이메일이면 코드가 발송되고, 통과하면 user와 소셜 account가 함께 생긴다")
    void 신규_이메일이면_계정이_생긴다() {
        String ticket = service.issueTicket(구글신원());
        UUID verificationId = service.requestEmailVerification(ticket, "New@Example.com", IP);

        assertThat(mailer.otpMails).hasSize(1);
        assertThat(users.rows).as("코드 발송 단계에서는 아직 사용자가 없다").isEmpty();

        SocialLoginOutcome outcome = service.completeSignup(verificationId, mailer.lastOtpCode(), CLIENT);

        assertThat(outcome.status()).isEqualTo(SocialLoginOutcome.Status.SIGNED_IN);
        assertThat(users.rows).hasSize(1);
        User created = users.rows.values().iterator().next();
        assertThat(created.email().raw()).as("사용자가 입력한 원문이 보존된다").isEqualTo("New@Example.com");

        assertThat(accounts.findByUserIdAndProvider(created.id(), AuthProvider.GOOGLE))
                .hasValueSatisfying(account -> {
                    assertThat(account.providerAccountId()).isEqualTo(GOOGLE_SUBJECT);
                    assertThat(account.passwordHash()).as("소셜 계정에는 비밀번호가 없다").isNull();
                    // 제공자 토큰을 보관하지 않는다는 것은 이제 타입이 보장한다 (결정-0022) — 담을 자리가 없다
                });
    }

    @Test
    @DisplayName("AUTH-05 그 이메일에 이미 계정이 있으면 코드를 보내지 않고 연동을 안내한다")
    void 기존_계정이면_코드를_보내지_않는다() {
        로컬가입자를_만든다("taken@example.com");
        String ticket = service.issueTicket(구글신원());

        UUID verificationId = service.requestEmailVerification(ticket, "taken@example.com", IP);

        assertThat(verificationId).as("응답 형태는 신규와 같다").isNotNull();
        assertThat(mailer.otpMails).as("코드가 발송되지 않는다").isEmpty();
        assertThat(mailer.existingAccountGuides).containsExactly("taken@example.com");
    }

    @Test
    @DisplayName("AUTH-05 로컬 가입 후 같은 이메일로 소셜을 시도해도 계정이 합쳐지지 않는다 — 로그인 후 연동해야 한다")
    void 로컬_가입자의_이메일로는_소셜_계정이_생기지_않는다() {
        UUID localUserId = 로컬가입자를_만든다("both@example.com");
        String ticket = service.issueTicket(구글신원());
        UUID verificationId = service.requestEmailVerification(ticket, "both@example.com", IP);

        // 코드가 발송되지 않았으므로 맞힐 코드가 없다. 어떤 값을 넣어도 통과할 수 없다
        assertThatThrownBy(() -> service.completeSignup(verificationId, "000000", CLIENT))
                .isInstanceOf(BusinessException.class);

        assertThat(users.rows).as("사용자가 늘어나지 않는다").hasSize(1);
        assertThat(accounts.findByUserIdAndProvider(localUserId, AuthProvider.GOOGLE))
                .as("소셜 계정이 붙지 않는다 — 연동은 로그인 후에만 가능하다")
                .isEmpty();
    }

    @Test
    @DisplayName("AUTH-02 위조되거나 만료된 표로는 이메일 단계에 들어갈 수 없다")
    void 표가_유효하지_않으면_거부한다() {
        assertThatThrownBy(() -> service.requestEmailVerification("위조된표", "new@example.com", IP))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_SOCIAL_TICKET_INVALID));

        String ticket = service.issueTicket(구글신원());
        clock.advance(PendingSocialTicketCodec.TTL.plus(Duration.ofSeconds(1)));

        assertThatThrownBy(() -> service.requestEmailVerification(ticket, "new@example.com", IP))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_SOCIAL_TICKET_INVALID));
    }

    @Test
    @DisplayName("AUTH-06 이메일/비밀번호 가입용 코드는 소셜 완료에 통과하지 않는다")
    void 소셜이_아닌_대기_레코드는_통과하지_않는다() {
        Verification plainSignup = Verification.issueSignup(
                UUID.randomUUID(), "plain@example.com", "plain@example.com", "hmac(123456)", clock.instant());
        verifications.save(plainSignup);

        assertThatThrownBy(() -> service.completeSignup(plainSignup.id(), "123456", CLIENT))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_OTP_INVALID));
    }

    @Test
    @DisplayName("AUTH-02 코드는 1회용이다 — 같은 코드로 계정을 두 번 만들 수 없다")
    void 코드는_한_번만_쓸_수_있다() {
        String ticket = service.issueTicket(구글신원());
        UUID verificationId = service.requestEmailVerification(ticket, "once@example.com", IP);
        String code = mailer.lastOtpCode();

        service.completeSignup(verificationId, code, CLIENT);

        assertThatThrownBy(() -> service.completeSignup(verificationId, code, CLIENT))
                .isInstanceOf(BusinessException.class);
        assertThat(users.rows).hasSize(1);
    }

    @Test
    @DisplayName("AUTH-02 이메일 단계 도중 같은 신원으로 계정이 생기면 다시 로그인하게 한다")
    void 도중에_계정이_생기면_표를_무효화한다() {
        String ticket = service.issueTicket(구글신원());

        // 다른 탭에서 같은 소셜 신원으로 가입이 완료된 상황
        User other = User.register(UUID.randomUUID(), EmailAddress.of("other@example.com"), clock.instant());
        users.save(other);
        accounts.save(
                Account.social(UUID.randomUUID(), other.id(), AuthProvider.GOOGLE, GOOGLE_SUBJECT, clock.instant()));

        assertThatThrownBy(() -> service.requestEmailVerification(ticket, "new@example.com", IP))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode())
                        .isEqualTo(AuthErrorCode.AUTH_SOCIAL_TICKET_INVALID));
    }
}
