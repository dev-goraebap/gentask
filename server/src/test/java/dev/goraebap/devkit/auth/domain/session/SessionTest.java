package dev.goraebap.devkit.auth.domain.session;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SessionTest {

    private static final Instant NOW = Instant.parse("2026-07-28T09:00:00Z");
    private static final Duration TTL = Duration.ofDays(30);
    private static final Duration ABSOLUTE_TTL = Duration.ofDays(90);
    private static final Duration TOUCH_INTERVAL = Duration.ofHours(1);

    private Session issue() {
        return Session.issue(UUID.randomUUID(), UUID.randomUUID(), "token-hash", NOW, TTL, null, null);
    }

    @Test
    @DisplayName("AUTH-06 세션은 만료 시각 이후 유효하지 않다")
    void 만료를_판정한다() {
        Session session = issue();

        assertThat(session.isExpired(NOW.plus(TTL).minusSeconds(1))).isFalse();
        assertThat(session.isExpired(NOW.plus(TTL))).isTrue();
    }

    @Test
    @DisplayName("AUTH-06 사용 시 만료가 연장된다 — 슬라이딩 (결정-0014)")
    void 사용하면_만료가_연장된다() {
        Session session = issue();
        Instant later = NOW.plus(Duration.ofHours(2));

        assertThat(session.touch(later, TTL, ABSOLUTE_TTL, TOUCH_INTERVAL)).isTrue();
        assertThat(session.lastUsedAt()).isEqualTo(later);
        assertThat(session.expiresAt()).isEqualTo(later.plus(TTL));
    }

    @Test
    @DisplayName("AUTH-06 연장 간격 안의 재사용은 쓰기를 만들지 않는다")
    void 간격_안에서는_연장하지_않는다() {
        Session session = issue();

        assertThat(session.touch(NOW.plus(Duration.ofMinutes(30)), TTL, ABSOLUTE_TTL, TOUCH_INTERVAL))
                .isFalse();
        assertThat(session.expiresAt()).isEqualTo(NOW.plus(TTL));
    }

    @Test
    @DisplayName("AUTH-06 만료된 세션은 연장되지 않는다")
    void 만료된_세션은_연장되지_않는다() {
        Session session = issue();

        assertThat(session.touch(NOW.plus(TTL), TTL, ABSOLUTE_TTL, TOUCH_INTERVAL))
                .isFalse();
    }

    @Test
    @DisplayName("AUTH-06 연장은 발급 시점 기준 절대 상한을 넘지 못한다 — 계속 쓰는 세션도 언젠가 만료된다")
    void 절대_상한을_넘지_않는다() {
        Session session = issue();
        // 상한을 TTL보다 짧게 두면 첫 연장에서 바로 상한에 걸린다
        Duration shortAbsoluteTtl = Duration.ofDays(40);
        Instant used = NOW.plus(Duration.ofDays(20));

        assertThat(session.touch(used, TTL, shortAbsoluteTtl, TOUCH_INTERVAL)).isTrue();

        // 연장해도 20+30=50일이 아니라 발급 기준 40일에서 멈춘다
        assertThat(session.expiresAt()).isEqualTo(NOW.plus(shortAbsoluteTtl));
        assertThat(session.isExpired(NOW.plus(shortAbsoluteTtl))).isTrue();
    }
}
