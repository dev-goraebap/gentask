package dev.goraebap.devkit.auth.application.shared;

import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;

/**
 * 세션 쿠키 조립 (결정-0014 §결정 2). {@code HttpOnly}라 JS가 접근할 수 없고, {@code SameSite=Lax}
 * + Origin 검증(인프라의 OriginCheckFilter)이 쿠키 경로의 CSRF 방어를 이룬다.
 */
@RequiredArgsConstructor
public class SessionCookieFactory {

    private final AuthProperties properties;

    public ResponseCookie issue(String token, Instant expiresAt, Instant now) {
        return builder(token).maxAge(Duration.between(now, expiresAt)).build();
    }

    public ResponseCookie expire() {
        return builder("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder builder(String value) {
        AuthProperties.Session session = properties.session();
        return ResponseCookie.from(session.cookieName(), value)
                .httpOnly(true)
                .secure(session.cookieSecure())
                .sameSite("Lax")
                .path("/");
    }
}
