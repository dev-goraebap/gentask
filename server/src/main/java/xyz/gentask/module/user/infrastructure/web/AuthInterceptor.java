package xyz.gentask.module.user.infrastructure.web;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import xyz.gentask.module.user.application.AuthRequestAttributes;
import xyz.gentask.module.user.application.TokenHasher;
import xyz.gentask.module.user.application.UserErrorCode;
import xyz.gentask.module.user.application.auth.AuthProperties;
import xyz.gentask.module.user.domain.apitoken.ApiToken;
import xyz.gentask.module.user.domain.apitoken.ApiTokenRepository;
import xyz.gentask.module.user.domain.session.Session;
import xyz.gentask.module.user.domain.session.SessionRepository;
import xyz.gentask.shared.web.CurrentUser;

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
