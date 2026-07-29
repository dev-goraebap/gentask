package dev.goraebap.devkit.auth.application.sociallogin;

import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import java.time.Instant;

/**
 * 제공자가 증명해준 신원 (AUTH-02·03).
 *
 * <p>제공자가 증명하는 것은 <b>"이 사람이 그 제공자의 그 계정 주인이다"</b> 하나뿐이다.
 * 이메일은 담지 않는다 — 제공자가 준 이메일을 신뢰하지 않기로 했고(결정-0015 §결정 2),
 * 담아두면 언젠가 "이미 있으니 그냥 쓰자"는 유혹이 생긴다. <b>타입에서 아예 없애 그 길을 막는다.</b>
 *
 * <p>토큰은 그 제공자의 API를 호출하기 위한 것이며 클라이언트로 나가지 않는다.
 */
public record SocialIdentity(
        AuthProvider provider,
        String providerAccountId,
        String accessToken,
        String refreshToken,
        Instant tokenExpiresAt) {}
