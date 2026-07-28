package dev.goraebap.devkit.auth.application.session;

import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.application.shared.PasswordHasher;
import dev.goraebap.devkit.auth.application.shared.SecureTokenGenerator;
import dev.goraebap.devkit.auth.application.shared.TokenHasher;
import dev.goraebap.devkit.auth.domain.account.Account;
import dev.goraebap.devkit.auth.domain.account.AccountRepository;
import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import dev.goraebap.devkit.auth.domain.session.Session;
import dev.goraebap.devkit.auth.domain.session.SessionRepository;
import dev.goraebap.devkit.auth.domain.user.EmailAddress;
import dev.goraebap.devkit.auth.domain.user.User;
import dev.goraebap.devkit.auth.domain.user.UserRepository;
import dev.goraebap.devkit.common.BusinessException;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 세션 발급·로그인·로그아웃 (AUTH-01, 결정-0014).
 *
 * <p>세션 발급은 이 피쳐가 소유하고 registration(가입 완료 시 자동 로그인)이 의존한다 —
 * 설계/서버.md §4의 "조율 공유" 처방이다.
 */
@Service
public class SessionService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final SessionRepository sessionRepository;
    private final TokenHasher tokenHasher;
    private final PasswordHasher passwordHasher;
    private final SecureTokenGenerator tokenGenerator;
    private final AuthProperties properties;
    private final Clock clock;

    /** 존재하지 않는 계정에도 같은 비용의 비교를 수행해 타이밍으로 계정 존재가 새는 것을 막는다. */
    private final String timingEqualizerHash;

    public SessionService(
            UserRepository userRepository,
            AccountRepository accountRepository,
            SessionRepository sessionRepository,
            TokenHasher tokenHasher,
            PasswordHasher passwordHasher,
            SecureTokenGenerator tokenGenerator,
            AuthProperties properties,
            Clock clock) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.sessionRepository = sessionRepository;
        this.tokenHasher = tokenHasher;
        this.passwordHasher = passwordHasher;
        this.tokenGenerator = tokenGenerator;
        this.properties = properties;
        this.clock = clock;
        this.timingEqualizerHash = passwordHasher.hash(tokenGenerator.sessionToken());
    }

    /** 세션 토큰을 새로 발급한다. 가입 완료·로그인·복구 로그인 모두 이 경로를 지난다. */
    @Transactional
    public IssuedSession issue(UUID userId, ClientInfo client) {
        String token = tokenGenerator.sessionToken();
        Instant now = clock.instant();
        Session session = Session.issue(
                UUID.randomUUID(),
                userId,
                tokenHasher.hmac(token),
                now,
                properties.session().ttl(),
                client.ipAddress(),
                client.userAgent());
        sessionRepository.save(session);
        return new IssuedSession(session.id(), userId, token, session.expiresAt());
    }

    /**
     * 이메일/비밀번호 로그인. 실패 응답은 "이메일이 없음"과 "비밀번호가 틀림"을 구분하지 않는다
     * (AUTH-01) — 예외 하나, 문구 하나다.
     */
    @Transactional
    public IssuedSession login(String email, String rawPassword, ClientInfo client) {
        Optional<User> user = findUser(email);
        Optional<Account> account =
                user.flatMap(u -> accountRepository.findByUserIdAndProvider(u.id(), AuthProvider.CREDENTIAL));

        String hashToCompare = account.map(Account::passwordHash).orElse(timingEqualizerHash);
        boolean passwordMatches = passwordHasher.matches(rawPassword, hashToCompare);

        if (account.isEmpty() || !passwordMatches) {
            throw new BusinessException(AuthErrorCode.AUTH_INVALID_CREDENTIALS, "이메일 또는 비밀번호를 확인해 주세요");
        }
        return issue(user.orElseThrow().id(), client);
    }

    /** 로그아웃 — 행 삭제로 즉시 무효화된다 (AUTH-01, 결정-0014). */
    @Transactional
    public void logout(UUID sessionId) {
        sessionRepository.deleteById(sessionId);
    }

    private Optional<User> findUser(String email) {
        try {
            return userRepository.findByEmailNormalized(EmailAddress.of(email).normalized());
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
