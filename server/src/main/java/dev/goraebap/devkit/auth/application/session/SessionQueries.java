package dev.goraebap.devkit.auth.application.session;

import java.util.Optional;
import java.util.UUID;

/** session 피쳐의 조회 포트 (설계/서버.md §5.1). 어댑터는 infrastructure/query. */
public interface SessionQueries {

    Optional<CurrentSessionView> findCurrentSession(UUID sessionId);
}
