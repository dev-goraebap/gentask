package dev.goraebap.devkit.auth.support;

import dev.goraebap.devkit.auth.application.shared.AttemptRateLimiter;
import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

/** 단위 테스트 공용 고정값. */
public final class AuthTestFixtures {

    public static final Instant BASE_TIME = Instant.parse("2026-07-28T09:00:00Z");

    private AuthTestFixtures() {}

    public static AuthProperties authProperties() {
        return new AuthProperties(
                "test-secret-that-is-long-enough-for-hmac",
                new AuthProperties.Session(
                        Duration.ofDays(30), Duration.ofDays(90), Duration.ofHours(1), "session_token", false),
                new AuthProperties.Otp(5, Duration.ofMinutes(10), 30, Duration.ofHours(1), 20, Duration.ofMinutes(10)),
                new AuthProperties.Login(20, Duration.ofMinutes(10), 10, Duration.ofMinutes(10)),
                List.of(),
                new AuthProperties.Oauth("http://localhost:4200", 20, Duration.ofMinutes(10)));
    }

    /** 항상 통과하는 rate limiter — 제한 자체를 검증하는 테스트에서만 다른 것을 쓴다. */
    public static AttemptRateLimiter permissiveRateLimiter() {
        return new AttemptRateLimiter() {
            @Override
            public boolean tryAcquire(String key, int limit, Duration window) {
                return true;
            }

            @Override
            public void reset(String key) {
                // 통과만 시키므로 비울 카운터가 없다
            }
        };
    }

    /** 테스트가 시각을 통제한다 (설계/데이터베이스.md §1.3). */
    public static MutableClock clock() {
        return new MutableClock(BASE_TIME, ZoneOffset.UTC);
    }
}
