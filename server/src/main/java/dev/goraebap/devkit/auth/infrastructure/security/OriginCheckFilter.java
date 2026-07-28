package dev.goraebap.devkit.auth.infrastructure.security;

import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 쿠키 경로의 CSRF 방어 (결정-0014 §결정 3) — Origin 검증.
 *
 * <p>세션 쿠키가 실린 상태 변경 요청은 {@code Origin} 헤더가 있어야 하고 허용 출처와 일치해야
 * 한다. 브라우저는 상태 변경 요청에 Origin을 항상 싣는다 — 없다는 것은 브라우저가 아니라는
 * 뜻이고, 브라우저가 아니면 쿠키를 자동 첨부당할 일도 없으므로 Bearer를 쓰면 된다.
 * {@code SameSite=Lax}(쿠키 속성)와 이중 방어다.
 *
 * <p>Bearer 경로는 해당 없다 — 공격 페이지는 피해자의 토큰을 헤더에 실을 수 없다.
 */
class OriginCheckFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    private final AuthProperties properties;
    private final ProblemResponseWriter problemWriter;

    OriginCheckFilter(AuthProperties properties, ProblemResponseWriter problemWriter) {
        this.properties = properties;
        this.problemWriter = problemWriter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (requiresCheck(request) && !originAllowed(request)) {
            problemWriter.write(request, response, AuthErrorCode.AUTH_FORBIDDEN_ORIGIN, "요청 출처를 확인할 수 없습니다");
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean requiresCheck(HttpServletRequest request) {
        return !SAFE_METHODS.contains(request.getMethod()) && hasSessionCookie(request);
    }

    private boolean originAllowed(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank() || "null".equals(origin)) {
            return false;
        }
        String normalized = origin.toLowerCase(Locale.ROOT);
        if (!properties.allowedOrigins().isEmpty()) {
            return properties.allowedOrigins().stream()
                    .anyMatch(allowed -> allowed.toLowerCase(Locale.ROOT).equals(normalized));
        }
        // 허용 목록이 비어 있으면 same-origin 배포 전제(설계/인프라.md)에 따라 요청 자신의 출처와 비교한다
        return normalized.equals(requestOrigin(request));
    }

    private String requestOrigin(HttpServletRequest request) {
        String scheme = request.getScheme().toLowerCase(Locale.ROOT);
        int port = request.getServerPort();
        boolean defaultPort = ("http".equals(scheme) && port == 80) || ("https".equals(scheme) && port == 443);
        String host = request.getServerName().toLowerCase(Locale.ROOT);
        return defaultPort ? scheme + "://" + host : scheme + "://" + host + ":" + port;
    }

    private boolean hasSessionCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return false;
        }
        String cookieName = properties.session().cookieName();
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName()) && !cookie.getValue().isBlank()) {
                return true;
            }
        }
        return false;
    }
}
