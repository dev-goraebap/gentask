package dev.goraebap.refarch.module.user.application;

import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * 세션 쿠키를 굽는다. HttpOnly 라 스크립트가 읽을 수 없고, SameSite=Lax 가 타 사이트발
 * 상태 변경 요청에 쿠키를 싣지 않는다.
 */
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
