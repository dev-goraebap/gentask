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

@Service
public class AuthService {

    public record IssuedSession(String token, Instant expiresAt) {}

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final SessionRepository sessionRepository;
    private final PasswordHasher passwordHasher;
    private final TokenHasher tokenHasher;
    private final TokenGenerator tokenGenerator;
    private final AuthProperties properties;
    private final Clock clock;

    private final String timingEqualizerHash;

    // --- 생성 --------------------------------------------------------------------------------------------------------
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

    // --- 명령 --------------------------------------------------------------------------------------------------------
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

    @Transactional
    public void logout(UUID sessionId) {
        sessionRepository.deleteById(sessionId);
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------
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
