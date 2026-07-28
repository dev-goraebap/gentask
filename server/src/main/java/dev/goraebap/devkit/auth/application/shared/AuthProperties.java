package dev.goraebap.devkit.auth.application.shared;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * auth 모듈 설정. 시크릿은 환경변수 {@code AUTH_SECRET}으로 주입한다 (설계/서버.md §8).
 *
 * <p>OTP의 만료·시도 한도는 여기 없다 — 보안 파라미터로서 도메인 상수다
 * ({@code Verification.TTL}·{@code MAX_ATTEMPTS}, 결정-0015 §결정 3). 발송 rate limit만 운영
 * 설정으로 둔다.
 */
@ConfigurationProperties(prefix = "auth")
public record AuthProperties(String secret, Session session, Otp otp, List<String> allowedOrigins) {

    public AuthProperties {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("auth.secret이 비어 있다 — AUTH_SECRET 환경변수를 확인하라");
        }
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
    }

    /** 세션 수명과 쿠키 속성 (결정-0014). */
    public record Session(Duration ttl, Duration touchInterval, String cookieName, boolean cookieSecure) {}

    /** OTP 발송 rate limit — IP는 촘촘히, 이메일은 넉넉히 (결정-0015 §결정 3). */
    public record Otp(int ipLimit, Duration ipWindow, int emailLimit, Duration emailWindow) {}
}
