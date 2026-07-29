package dev.goraebap.devkit.auth.application.shared;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 시크릿 검증이 기동을 막는지 고정한다.
 *
 * <p>이 테스트가 지키는 것은 {@code application.properties}의 {@code auth.secret=${AUTH_SECRET}}에
 * 누군가 기본값을 되돌려 넣지 못하게 하는 의도다 — 시크릿이 저장소에 있으면 DB가 유출됐을 때
 * OTP 다이제스트를 10⁶ 전수로 복원할 수 있어 HMAC 저장의 의미가 사라진다.
 */
class AuthPropertiesTest {

    private static AuthProperties withSecret(String secret) {
        return new AuthProperties(
                secret,
                new AuthProperties.Session(
                        Duration.ofDays(30), Duration.ofDays(90), Duration.ofHours(1), "session_token", true),
                new AuthProperties.Otp(5, Duration.ofMinutes(10), 30, Duration.ofHours(1), 20, Duration.ofMinutes(10)),
                new AuthProperties.Login(20, Duration.ofMinutes(10), 10, Duration.ofMinutes(10)),
                List.of(),
                new AuthProperties.Oauth("http://localhost:4200"));
    }

    @Test
    @DisplayName("AUTH-06 시크릿이 없으면 기동할 수 없다")
    void 시크릿이_비어_있으면_거부한다() {
        assertThatThrownBy(() -> withSecret(null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> withSecret("   ")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("AUTH-06 짧은 시크릿은 거부한다 — HMAC 키로 쓰기에 부족하다")
    void 짧은_시크릿을_거부한다() {
        assertThatThrownBy(() -> withSecret("a".repeat(31))).isInstanceOf(IllegalArgumentException.class);
        assertThatCode(() -> withSecret("a".repeat(32))).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("AUTH-06 허용 출처 목록은 없으면 빈 목록이 된다 — null이 흘러 다니지 않는다")
    void 허용_출처가_없으면_빈_목록이다() {
        assertThatCode(() -> new AuthProperties(
                        "a".repeat(32),
                        new AuthProperties.Session(
                                Duration.ofDays(30), Duration.ofDays(90), Duration.ofHours(1), "session_token", true),
                        new AuthProperties.Otp(
                                5, Duration.ofMinutes(10), 30, Duration.ofHours(1), 20, Duration.ofMinutes(10)),
                        new AuthProperties.Login(20, Duration.ofMinutes(10), 10, Duration.ofMinutes(10)),
                        null,
                        new AuthProperties.Oauth("http://localhost:4200")))
                .doesNotThrowAnyException();
    }
}
