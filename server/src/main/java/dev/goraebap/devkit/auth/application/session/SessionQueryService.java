package dev.goraebap.devkit.auth.application.session;

import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.common.BusinessException;
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
}
