package dev.goraebap.refarch.module.user.domain.session;

import java.util.Optional;
import java.util.UUID;

public interface SessionRepository {

    void save(Session session);

    Optional<Session> findByTokenHash(String tokenHash);

    void deleteById(UUID sessionId);
}
