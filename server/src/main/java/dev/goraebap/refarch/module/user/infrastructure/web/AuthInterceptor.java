package dev.goraebap.refarch.module.user.infrastructure.web;

import dev.goraebap.refarch.module.user.application.AuthProperties;
import dev.goraebap.refarch.module.user.application.AuthRequestAttributes;
import dev.goraebap.refarch.module.user.application.TokenHasher;
import dev.goraebap.refarch.module.user.application.UserErrorCode;
import dev.goraebap.refarch.module.user.domain.apitoken.ApiToken;
import dev.goraebap.refarch.module.user.domain.apitoken.ApiTokenRepository;
import dev.goraebap.refarch.module.user.domain.session.Session;
import dev.goraebap.refarch.module.user.domain.session.SessionRepository;
import dev.goraebap.refarch.shared.web.CurrentUser;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 지키는 경로의 요청마다 세션 또는 에이전트 토큰을 확인한다 (TK-005 A5).
 *
 * 두 경로가 다른 테이블을 본다. 브라우저는 HttpOnly 쿠키의 세션 토큰을, 에이전트는
 * `Authorization: Bearer` 의 발급 토큰(TK-006 A3)을 싣는다. 세션은 만료를 슬라이딩으로
 * 밀되 touch 간격 안에서는 쓰기를 내지 않는다.
 *
 * 어느 쪽도 성립하지 않으면 401 로 끝낸다. 지키지 않는 경로(가입 · 로그인)는 등록 설정이
 * 제외한다.
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";

    private final SessionRepository sessionRepository;
    private final ApiTokenRepository apiTokenRepository;
    private final TokenHasher tokenHasher;
    private final AuthProperties properties;
    private final Clock clock;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith(BEARER_PREFIX)) {
            return authenticateBearer(
                    request, authorization.substring(BEARER_PREFIX.length()).strip());
        }
        return authenticateCookie(request);
    }

    private boolean authenticateBearer(HttpServletRequest request, String token) {
        ApiToken apiToken = apiTokenRepository
                .findByTokenHash(tokenHasher.hmac(TokenHasher.Purpose.API_TOKEN, token))
                .orElseThrow(UserErrorCode.UNAUTHENTICATED::raise);
        request.setAttribute(CurrentUser.ATTRIBUTE, apiToken.userId());
        return true;
    }

    private boolean authenticateCookie(HttpServletRequest request) {
        String token = sessionCookie(request);
        if (token == null || token.isEmpty()) {
            throw UserErrorCode.UNAUTHENTICATED.raise();
        }

        Instant now = clock.instant();
        Session session = sessionRepository
                .findByTokenHash(tokenHasher.hmac(TokenHasher.Purpose.SESSION, token))
                .filter(found -> !found.isExpired(now))
                .orElseThrow(UserErrorCode.UNAUTHENTICATED::raise);

        AuthProperties.Session policy = properties.session();
        if (session.touch(now, policy.ttl(), policy.absoluteTtl(), policy.touchInterval())) {
            sessionRepository.save(session);
        }

        request.setAttribute(CurrentUser.ATTRIBUTE, session.userId());
        request.setAttribute(AuthRequestAttributes.SESSION_ID, session.id());
        return true;
    }

    private String sessionCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        String cookieName = properties.session().cookieName();
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
