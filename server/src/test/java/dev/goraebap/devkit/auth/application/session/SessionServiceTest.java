package dev.goraebap.devkit.auth.application.session;

import static org.assertj.core.api.Assertions.assertThat;

import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.application.shared.SecureTokenGenerator;
import dev.goraebap.devkit.auth.domain.account.Account;
import dev.goraebap.devkit.auth.domain.user.EmailAddress;
import dev.goraebap.devkit.auth.domain.user.User;
import dev.goraebap.devkit.auth.support.AuthTestFixtures;
import dev.goraebap.devkit.auth.support.FakeCrypto;
import dev.goraebap.devkit.auth.support.InMemoryAuthRepositories;
import dev.goraebap.devkit.auth.support.MutableClock;
import dev.goraebap.devkit.common.BusinessException;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SessionServiceTest {

    private static final ClientInfo CLIENT = ClientInfo.of("203.0.113.10", "test-agent");

    private InMemoryAuthRepositories.Users users;
    private InMemoryAuthRepositories.Accounts accounts;
    private InMemoryAuthRepositories.Sessions sessions;
    private MutableClock clock;
    private SessionService service;
    private UUID userId;

    @BeforeEach
    void 초기화() {
        users = new InMemoryAuthRepositories.Users();
        accounts = new InMemoryAuthRepositories.Accounts();
        sessions = new InMemoryAuthRepositories.Sessions();
        clock = AuthTestFixtures.clock();
        service = new SessionService(
                users,
                accounts,
                sessions,
                FakeCrypto.tokenHasher(),
                FakeCrypto.passwordHasher(),
                new SecureTokenGenerator(),
                AuthTestFixtures.authProperties(),
                clock);

        User user = User.register(UUID.randomUUID(), EmailAddress.of("alice@example.com"), clock.instant());
        users.save(user);
        userId = user.id();
        accounts.save(Account.credential(
                UUID.randomUUID(), userId, FakeCrypto.passwordHasher().hash("correct-password"), clock.instant()));
    }

    @Test
    @DisplayName("AUTH-01 올바른 이메일과 비밀번호로 로그인하면 세션 토큰이 새로 발급된다")
    void 로그인하면_세션이_발급된다() {
        IssuedSession issued = service.login("Alice@Example.com", "correct-password", CLIENT);

        assertThat(issued.userId()).isEqualTo(userId);
        assertThat(issued.token()).isNotBlank();
        assertThat(sessions.findByTokenHash("hmac(" + issued.token() + ")")).isPresent();
    }

    @Test
    @DisplayName("AUTH-01 로그인 실패 응답은 이메일 없음과 비밀번호 틀림을 구분하지 않는다")
    void 실패_사유를_구분하지_않는다() {
        BusinessException wrongPassword = catchBusiness(() -> service.login("alice@example.com", "wrong", CLIENT));
        BusinessException unknownEmail = catchBusiness(() -> service.login("nobody@example.com", "wrong", CLIENT));

        assertThat(wrongPassword.errorCode()).isEqualTo(AuthErrorCode.AUTH_INVALID_CREDENTIALS);
        assertThat(unknownEmail.errorCode()).isEqualTo(AuthErrorCode.AUTH_INVALID_CREDENTIALS);
        assertThat(wrongPassword.getMessage()).isEqualTo(unknownEmail.getMessage());
        assertThat(sessions.rows).isEmpty();
    }

    @Test
    @DisplayName("AUTH-01 로그아웃하면 세션이 즉시 무효화된다 — 행 삭제 (결정-0014)")
    void 로그아웃하면_세션이_삭제된다() {
        IssuedSession issued = service.login("alice@example.com", "correct-password", CLIENT);

        service.logout(issued.sessionId());

        assertThat(sessions.rows).isEmpty();
        assertThat(sessions.findByTokenHash("hmac(" + issued.token() + ")")).isEmpty();
    }

    private BusinessException catchBusiness(Runnable runnable) {
        try {
            runnable.run();
        } catch (BusinessException e) {
            return e;
        }
        throw new AssertionError("BusinessException이 발생해야 한다");
    }
}
