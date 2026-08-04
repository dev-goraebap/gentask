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
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
class OriginCheckFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    private final AuthProperties properties;
    private final ProblemResponseWriter problemWriter;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (requiresCheck(request) && !originAllowed(request)) {
            problemWriter.write(request, response, AuthErrorCode.AUTH_FORBIDDEN_ORIGIN, "요청 출처를 확인할 수 없습니다");
            return;
        }
        chain.doFilter(request, response);
    }

    /**
     * 상태를 바꾸는 요청 전반을 본다. <b>세션 쿠키가 있을 때만 보던 것을 넓혔다</b>(검토 #32-2).
     *
     * <p>좁게 두면 <b>세션 고정(session fixation)</b>이 열린다. 로그인하지 않은 피해자가 공격
     * 페이지를 열면 공격자 계정의 {@code verificationId}+{@code code}로 교차 출처 POST가 나가고,
     * 그 응답의 {@code Set-Cookie}가 <b>공격자 세션을 피해자 브라우저에 심는다.</b> 이후 피해자는
     * 자기 계정인 줄 알고 공격자 계정에 데이터를 입력한다. 요청 시점에 쿠키가 없으므로 옛 조건에는
     * 걸리지 않았다.
     */
    private boolean requiresCheck(HttpServletRequest request) {
        return !SAFE_METHODS.contains(request.getMethod());
    }

    /**
     * {@code Origin}이 있으면 반드시 맞아야 한다. <b>없을 때의 처리는 세션 쿠키 유무로 갈린다.</b>
     *
     * <ul>
     *   <li><b>쿠키가 실려 있다</b> — 헤더를 요구한다. 브라우저는 POST에 항상 {@code Origin}을
     *       보내므로, 쿠키를 들고 오면서 헤더가 없는 것은 정상 브라우저 요청이 아니다
     *   <li><b>쿠키가 없다</b> — 통과시킨다. 모바일·서버 클라이언트는 {@code Origin}을 보내지
     *       않으며, 이들은 Bearer로 토큰을 직접 받으므로 쿠키가 심길 일이 없다
     * </ul>
     *
     * <p>공격자의 교차 출처 POST는 <b>브라우저가 자기 출처를 붙여 보내므로</b> 첫 조건에서 걸린다 —
     * 헤더를 지울 수 없다는 것이 이 방어의 근거다.
     */
    private boolean originAllowed(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank() || "null".equals(origin)) {
            return !hasSessionCookie(request);
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
