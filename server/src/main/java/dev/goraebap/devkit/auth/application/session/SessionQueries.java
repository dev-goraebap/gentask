package dev.goraebap.devkit.auth.application.session;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** session 피쳐의 조회 포트 (설계/서버.md §5.1). 어댑터는 infrastructure/query. */
public interface SessionQueries {

    Optional<CurrentSessionView> findCurrentSession(UUID sessionId);

    /**
     * 한 사용자의 <b>만료되지 않은</b> 세션 목록 (AUTH-06 기기 관리).
     *
     * <p>만료 판정을 조회에 넣는 이유: 정리 작업은 하루 한 번이라 만료된 행이 남아 있을 수 있는데,
     * 그것이 화면에 "로그인된 기기"로 보이면 사용자가 이미 끊긴 접근을 살아 있다고 오해한다.
     */
    List<UserSessionView> findActiveSessions(UUID userId, UUID currentSessionId);
}
