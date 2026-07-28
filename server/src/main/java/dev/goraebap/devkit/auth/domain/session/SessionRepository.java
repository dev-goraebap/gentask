package dev.goraebap.devkit.auth.domain.session;

import java.util.Optional;
import java.util.UUID;

/** 세션 저장소. 무효화는 행 삭제다 — 소프트 삭제를 두지 않는다 (결정-0014). */
public interface SessionRepository {

    void save(Session session);

    Optional<Session> findByTokenHash(String tokenHash);

    void deleteById(UUID id);

    void deleteAllByUserId(UUID userId);
}
