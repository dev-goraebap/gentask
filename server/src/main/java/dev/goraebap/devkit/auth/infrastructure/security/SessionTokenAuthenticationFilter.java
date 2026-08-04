package dev.goraebap.devkit.auth.infrastructure.security;

import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import dev.goraebap.devkit.auth.application.shared.AuthenticatedUser;
import dev.goraebap.devkit.auth.application.shared.SessionTransport;
import dev.goraebap.devkit.auth.application.shared.TokenHasher;
import dev.goraebap.devkit.auth.domain.session.Session;
import dev.goraebap.devkit.auth.domain.session.SessionRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 세션 토큰 인증 (결정-0014) — 쿠키와 Bearer 두 경로가 같은 세션 테이블을 가리킨다.
 *
 * <p>토큰은 HMAC 다이제스트로 조회하고, 만료 판정은 조회 시점에 한다(정리는 용량 관리일 뿐이다).
 * 유효하면 슬라이딩 연장을 시도하고 SecurityContext에 주체를 싣는다. 무효하면 인증 없이
 * 통과시킨다 — 거부는 인가 계층(deny-by-default)의 몫이다.
 */
@RequiredArgsConstructor
class SessionTokenAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final SessionRepository sessionRepository;
    private final TokenHasher tokenHasher;
    private final AuthProperties properties;
    private final Clock clock;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        ResolvedToken resolved = resolveToken(request);
        if (resolved != null) {
            Instant now = clock.instant();
            sessionRepository
                    .findByTokenHash(tokenHasher.hmac(resolved.token()))
                    .filter(session -> !session.isExpired(now))
                    .ifPresent(session -> authenticate(session, resolved.transport(), now));
        }
        chain.doFilter(request, response);
    }

    private void authenticate(Session session, SessionTransport transport, Instant now) {
        AuthProperties.Session config = properties.session();
        if (session.touch(now, config.ttl(), config.absoluteTtl(), config.touchInterval())) {
            sessionRepository.save(session);
        }
        AuthenticatedUser principal = new AuthenticatedUser(session.userId(), session.id(), transport);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private ResolvedToken resolveToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            return new ResolvedToken(header.substring(BEARER_PREFIX.length()).strip(), SessionTransport.BEARER);
        }
        return sessionCookie(request)
                .map(cookie -> new ResolvedToken(cookie.getValue(), SessionTransport.COOKIE))
                .orElse(null);
    }

    private Optional<Cookie> sessionCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        String cookieName = properties.session().cookieName();
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName()) && !cookie.getValue().isBlank()) {
                return Optional.of(cookie);
            }
        }
        return Optional.empty();
    }

    private record ResolvedToken(String token, SessionTransport transport) {}
}
