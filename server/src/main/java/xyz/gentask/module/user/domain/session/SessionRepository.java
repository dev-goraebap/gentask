package xyz.gentask.module.user.domain.session;

import java.util.Optional;
import java.util.UUID;

public interface SessionRepository {

    void save(Session session);

    Optional<Session> findByTokenHash(String tokenHash);

    void deleteById(UUID sessionId);

    /** 그 계정의 모든 세션을 거둔다. 비밀번호 재설정이 이 자리를 쓴다. */
    void deleteByUserId(UUID userId);

    /**
     * 하나만 남기고 그 계정의 세션을 거둔다.
     *
     * <p>비밀번호 변경이 이 자리를 쓴다. 남기는 것은 지금 조작하는 자리이며, 그것까지 거두면 방금
     * 바꾼 사람이 다시 로그인해야 한다.
     */
    void deleteByUserIdExcept(UUID userId, UUID keepSessionId);
}
