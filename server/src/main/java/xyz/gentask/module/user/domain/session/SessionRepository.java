package xyz.gentask.module.user.domain.session;

import java.util.Optional;
import java.util.UUID;

public interface SessionRepository {

    void save(Session session);

    Optional<Session> findByTokenHash(String tokenHash);

    void deleteById(UUID sessionId);

    /** 해당 사용자의 모든 활성 세션을 삭제한다. */
    void deleteByUserId(UUID userId);

    /**
     * 지정한 세션을 제외하고 해당 사용자의 나머지 활성 세션을 모두 삭제한다.
     */
    void deleteByUserIdExcept(UUID userId, UUID keepSessionId);
}
