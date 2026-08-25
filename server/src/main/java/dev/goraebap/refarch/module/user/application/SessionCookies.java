package dev.goraebap.refarch.module.user.application;

import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SessionCookies {

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
