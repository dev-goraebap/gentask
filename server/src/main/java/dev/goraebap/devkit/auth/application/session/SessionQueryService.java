package dev.goraebap.devkit.auth.application.session;

import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.common.BusinessException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 현재 세션 조회 유스케이스. */
@Service
@Transactional(readOnly = true)
public class SessionQueryService {

    private final SessionQueries sessionQueries;

    public SessionQueryService(SessionQueries sessionQueries) {
        this.sessionQueries = sessionQueries;
    }

    public CurrentSessionView currentSession(UUID sessionId) {
        return sessionQueries
                .findCurrentSession(sessionId)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.AUTH_UNAUTHENTICATED, "세션을 찾을 수 없습니다"));
    }

    /** 로그인된 기기 목록 (AUTH-06). 자기 세션만 볼 수 있다 — userId는 인증 주체에서 온다. */
    public List<UserSessionView> activeSessions(UUID userId, UUID currentSessionId) {
        return sessionQueries.findActiveSessions(userId, currentSessionId);
    }
}
