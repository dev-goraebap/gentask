package dev.goraebap.devkit.auth.support;

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
                "test-secret",
                new AuthProperties.Session(Duration.ofDays(30), Duration.ofHours(1), "session_token", false),
                new AuthProperties.Otp(10, Duration.ofMinutes(10), 10, Duration.ofHours(1)),
                List.of());
    }

    /** 테스트가 시각을 통제한다 (설계/데이터베이스.md §1.3). */
    public static MutableClock clock() {
        return new MutableClock(BASE_TIME, ZoneOffset.UTC);
    }
}
