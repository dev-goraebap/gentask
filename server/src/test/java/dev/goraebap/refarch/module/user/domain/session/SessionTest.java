package dev.goraebap.refarch.module.user.domain.session;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SessionTest {

    private static final Duration TTL = Duration.ofDays(30);
    private static final Duration ABSOLUTE_TTL = Duration.ofDays(90);
    private static final Duration TOUCH_INTERVAL = Duration.ofHours(1);

    private final Instant origin = Instant.parse("2026-08-24T00:00:00Z");

    @Test
    @DisplayName("touch 간격 안의 사용은 만료를 밀지 않는다")
    void touch_간격_안의_사용은_만료를_밀지_않는다() {
        Session session = issue();

        boolean extended = session.touch(origin.plus(Duration.ofMinutes(30)), TTL, ABSOLUTE_TTL, TOUCH_INTERVAL);

        assertThat(extended).isFalse();
        assertThat(session.expiresAt()).isEqualTo(origin.plus(TTL));
    }

    @Test
    @DisplayName("간격을 지나 쓰면 그 시점부터 TTL 만큼 늘어난다")
    void 간격을_지나_쓰면_그_시점부터_TTL_만큼_늘어난다() {
        Session session = issue();
        Instant later = origin.plus(Duration.ofDays(10));

        boolean extended = session.touch(later, TTL, ABSOLUTE_TTL, TOUCH_INTERVAL);

        assertThat(extended).isTrue();
        assertThat(session.expiresAt()).isEqualTo(later.plus(TTL));
    }

    @Test
    @DisplayName("절대 상한을 넘겨 늘어나지 않는다")
    void 절대_상한을_넘겨_늘어나지_않는다() {
        Session session = issue();

        session.touch(origin.plus(Duration.ofDays(25)), TTL, ABSOLUTE_TTL, TOUCH_INTERVAL);
        session.touch(origin.plus(Duration.ofDays(50)), TTL, ABSOLUTE_TTL, TOUCH_INTERVAL);
        session.touch(origin.plus(Duration.ofDays(75)), TTL, ABSOLUTE_TTL, TOUCH_INTERVAL);

        assertThat(session.expiresAt()).isEqualTo(origin.plus(ABSOLUTE_TTL));
    }

    @Test
    @DisplayName("만료된 세션은 되살아나지 않는다")
    void 만료된_세션은_되살아나지_않는다() {
        Session session = issue();
        Instant afterExpiry = origin.plus(TTL).plus(Duration.ofDays(1));

        boolean extended = session.touch(afterExpiry, TTL, ABSOLUTE_TTL, TOUCH_INTERVAL);

        assertThat(extended).isFalse();
        assertThat(session.isExpired(afterExpiry)).isTrue();
    }

    private Session issue() {
        return Session.issue(UUID.randomUUID(), UUID.randomUUID(), "hash", origin, TTL);
    }
}
