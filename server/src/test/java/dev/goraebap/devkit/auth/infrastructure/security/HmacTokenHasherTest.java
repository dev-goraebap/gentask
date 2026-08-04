package dev.goraebap.devkit.auth.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;

import dev.goraebap.devkit.auth.application.shared.HmacPurpose;
import dev.goraebap.devkit.auth.application.shared.TokenHasher;
import dev.goraebap.devkit.auth.support.AuthTestFixtures;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * HMAC 용도 분리 (보안 검토 F5).
 *
 * <p>세션 토큰 해시·OTP 해시·표 서명이 모두 같은 앱 시크릿을 키로 쓴다. 용도 라벨이 없으면
 * 이들은 같은 함수의 출력이라, 한 용도에서 얻은 값이 다른 용도에서 통하는 길이 열릴 수 있다.
 * <b>이 테스트가 그 분리를 고정한다</b> — 라벨을 빼면 첫 번째 테스트가 실패한다.
 */
class HmacTokenHasherTest {

    private final TokenHasher hasher = new HmacTokenHasher(AuthTestFixtures.authProperties());

    @Test
    @DisplayName("AUTH-06 같은 값이라도 용도가 다르면 다른 다이제스트가 나온다")
    void 용도가_다르면_결과가_다르다() {
        String sameValue = "collision-candidate";

        Set<String> digests = new HashSet<>();
        for (HmacPurpose purpose : HmacPurpose.values()) {
            digests.add(hasher.hmac(purpose, sameValue));
        }

        assertThat(digests).as("용도 수만큼 서로 다른 값이 나와야 한다 — 겹치면 용도 분리가 없는 것이다").hasSize(HmacPurpose.values().length);
    }

    @Test
    @DisplayName("AUTH-06 같은 용도·같은 값은 항상 같은 다이제스트를 낸다 — 인덱스 조회의 전제다")
    void 같은_입력은_같은_결과를_낸다() {
        String token = "session-token-abc";

        assertThat(hasher.hmac(HmacPurpose.SESSION, token)).isEqualTo(hasher.hmac(HmacPurpose.SESSION, token));
    }

    @Test
    @DisplayName("AUTH-06 다이제스트는 소문자 hex 64자다 (설계/데이터베이스.md §1.4)")
    void 형식이_고정되어_있다() {
        assertThat(hasher.hmac(HmacPurpose.SESSION, "any")).matches("[0-9a-f]{64}");
    }

    @Test
    @DisplayName("AUTH-06 라벨 경계가 값 안으로 밀려도 다른 용도와 충돌하지 않는다")
    void 라벨_경계를_흉내내도_충돌하지_않는다() {
        // "session:" + "otp:x" 와 "otp:" + "..." 가 같은 입력이 되는 일이 없어야 한다.
        // 라벨 집합이 소문자 영문뿐이라 구분자 :가 안전하다는 전제를 이 테스트가 지킨다.
        String spoofed = HmacPurpose.OTP.label() + ":x";

        assertThat(hasher.hmac(HmacPurpose.SESSION, spoofed)).isNotEqualTo(hasher.hmac(HmacPurpose.OTP, "x"));
    }

    @Test
    @DisplayName("AUTH-06 용도 라벨에는 구분자가 들어 있지 않다")
    void 라벨에_구분자가_없다() {
        assertThat(Arrays.stream(HmacPurpose.values()).map(HmacPurpose::label))
                .as("라벨에 :가 들어가면 길이 접두 방식으로 바꿔야 한다")
                .noneMatch(label -> label.contains(":"));
    }
}
