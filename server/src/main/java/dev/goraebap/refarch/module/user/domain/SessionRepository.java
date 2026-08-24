package dev.goraebap.refarch.module.user.domain;

import java.util.Optional;
import java.util.UUID;

public interface SessionRepository {

    void save(Session session);

    Optional<Session> findByTokenHash(String tokenHash);

    void deleteById(UUID sessionId);
}
