package xyz.gentask.module.user.application.auth;

import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.user.application.TokenGenerator;
import xyz.gentask.module.user.application.TokenHasher;
import xyz.gentask.module.user.domain.session.Session;
import xyz.gentask.module.user.domain.session.SessionRepository;

@Service
@RequiredArgsConstructor
public class AuthService {
    public record IssuedSession(String token, Instant expiresAt) {}

    private final SessionRepository sessionRepository;
    private final TokenGenerator tokenGenerator;
    private final TokenHasher tokenHasher;
    private final AuthProperties properties;

    @Transactional
    public void logout(UUID sessionId) {
        sessionRepository.deleteById(sessionId);
    }

    @Transactional
    public IssuedSession issueSession(UUID userId, Instant now) {
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
