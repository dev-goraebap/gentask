package dev.goraebap.devkit.auth.infrastructure.security;

import dev.goraebap.devkit.auth.application.shared.AttemptRateLimiter;
import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 소셜 로그인 시작 경로({@code /oauth2/authorization/**})의 요청 빈도를 IP 단위로 제한한다
 * (보안 검토 F3).
 *
 * <p><b>왜 이 경로에만 따로 제한이 필요한가.</b> 이 앱은 세션을 DB에 두고 서블릿 세션을 쓰지 않는다
 * (결정-0014). 그런데 {@code oauth2Login}이 인가 요청의 {@code state}와 PKCE {@code code_verifier}를
 * 보관하려고 <b>서블릿 세션을 만든다</b> — 요청 한 번에 하나씩, 인증도 표도 필요 없이. 이 경로는
 * 로그인 전이라 열려 있어야 하므로, 제한이 없으면 <b>누구든 이 주소를 반복 호출하는 것만으로 세션
 * 객체를 쌓아 힙을 고갈시킬 수 있다.</b>
 *
 * <p>서블릿 세션 자체를 없애려면 인가 요청 저장소를 쿠키 기반으로 직접 만들어야 하는데, 그것은
 * {@code code_verifier}를 다루는 보안 민감 부품을 손으로 짜는 일이라 키트가 질 위험이 더 크다고
 * 봤다. 대신 <b>제한 + 짧은 세션 수명</b>으로 막는다 (application.properties의 {@code server.servlet.session}).
 *
 * <p>제한에 걸리면 JSON이 아니라 <b>에러 화면으로 리다이렉트</b>한다 — 이 경로는 브라우저의 최상위
 * 탐색이라 사용자가 응답 본문을 그대로 보게 되기 때문이다.
 */
@Component
@RequiredArgsConstructor
class AuthorizationStartRateLimitFilter extends OncePerRequestFilter {

    private static final String PATH_PREFIX = "/oauth2/authorization/";

    private final AttemptRateLimiter rateLimiter;
    private final AuthProperties properties;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(PATH_PREFIX);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        AuthProperties.Oauth oauth = properties.oauth();
        if (!rateLimiter.tryAcquire(
                "oauth:start:ip:" + request.getRemoteAddr(), oauth.startIpLimit(), oauth.startIpWindow())) {
            logger.warn("소셜 로그인 시작 요청이 한도를 넘었다 (ip=" + request.getRemoteAddr() + ")");
            response.sendRedirect(properties.oauthRedirectBase() + "/auth/error?reason="
                    + AuthErrorCode.AUTH_OTP_RATE_LIMITED.name().toLowerCase(java.util.Locale.ROOT));
            return;
        }
        chain.doFilter(request, response);
    }
}
