package dev.goraebap.refarch.module.user.application;

import dev.goraebap.refarch.module.user.domain.Email;
import dev.goraebap.refarch.module.user.domain.account.Account;
import dev.goraebap.refarch.module.user.domain.account.AccountRepository;
import dev.goraebap.refarch.module.user.domain.session.Session;
import dev.goraebap.refarch.module.user.domain.session.SessionRepository;
import dev.goraebap.refarch.module.user.domain.user.Nickname;
import dev.goraebap.refarch.module.user.domain.user.User;
import dev.goraebap.refarch.module.user.domain.user.UserRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** TK-005. */
@Service
public class AuthService {

    /** 컨트롤러가 쿠키를 굽는 데 쓰는 발급 결과다. 토큰 원문은 응답 밖으로 나가지 않는다. */
    public record IssuedSession(String token, Instant expiresAt) {}

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final SessionRepository sessionRepository;
    private final PasswordHasher passwordHasher;
    private final TokenHasher tokenHasher;
    private final TokenGenerator tokenGenerator;
    private final AuthProperties properties;
    private final Clock clock;

    /** 없는 계정에도 같은 비용의 비교를 수행해 응답 시간이 계정의 존재를 말하지 않게 한다. */
    private final String timingEqualizerHash;

    public AuthService(
            UserRepository userRepository,
            AccountRepository accountRepository,
            SessionRepository sessionRepository,
            PasswordHasher passwordHasher,
            TokenHasher tokenHasher,
            TokenGenerator tokenGenerator,
            AuthProperties properties,
            Clock clock) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.sessionRepository = sessionRepository;
        this.passwordHasher = passwordHasher;
        this.tokenHasher = tokenHasher;
        this.tokenGenerator = tokenGenerator;
        this.properties = properties;
        this.clock = clock;
        this.timingEqualizerHash = passwordHasher.hash("timing-equalizer");
    }

    /** TK-005 A1. 등록이 곧 로그인이다. 등록 직후 로그인 화면을 다시 지나게 할 이유가 없다. */
    @Transactional
    public IssuedSession signup(String rawEmail, String rawPassword, String rawNickname) {
        Email email = Email.of(rawEmail);
        if (userRepository.existsByEmailNormalized(email.normalized())) {
            throw UserErrorCode.EMAIL_ALREADY_USED.raise();
        }

        Instant now = clock.instant();
        Nickname nickname =
                rawNickname == null || rawNickname.isBlank() ? Nickname.fromEmail(email) : Nickname.of(rawNickname);
        User user = User.create(UUID.randomUUID(), email, nickname, now);
        userRepository.save(user);
        accountRepository.save(
                Account.createCredential(UUID.randomUUID(), user.id(), email, passwordHasher.hash(rawPassword), now));

        return issueSession(user.id(), now);
    }

    /** TK-005 기본 흐름과 A2. */
    @Transactional
    public IssuedSession login(String rawEmail, String rawPassword) {
        Email email = Email.of(rawEmail);
        Account account = accountRepository.findCredential(email.normalized()).orElse(null);

        if (account == null) {
            passwordHasher.matches(rawPassword, timingEqualizerHash);
            throw UserErrorCode.INVALID_CREDENTIALS.raise();
        }
        if (!passwordHasher.matches(rawPassword, account.passwordHash())) {
            throw UserErrorCode.INVALID_CREDENTIALS.raise();
        }

        return issueSession(account.userId(), clock.instant());
    }

    /** TK-005 A4. 세션 행을 지우므로 즉시 무효다. */
    @Transactional
    public void logout(UUID sessionId) {
        sessionRepository.deleteById(sessionId);
    }

    private IssuedSession issueSession(UUID userId, Instant now) {
        String token = tokenGenerator.generate();
        Session session = Session.issue(
                UUID.randomUUID(),
                userId,
                tokenHasher.hmac(TokenHasher.Purpose.SESSION, token),
                now,
                properties.session().ttl());
        sessionRepository.save(session);
        return new IssuedSession(token, session.expiresAt());
    }
}
