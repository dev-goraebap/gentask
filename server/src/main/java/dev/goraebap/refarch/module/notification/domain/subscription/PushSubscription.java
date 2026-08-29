package dev.goraebap.refarch.module.notification.domain.subscription;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 알림을 받을 자리 하나. 기기마다 서며 계정에 하나가 아니다.
 *
 * <p>{@code endpoint} 는 푸시 서비스가 발급한 주소이며 그 자체가 구독의 식별자다. 같은 브라우저가 다시
 * 구독하면 같은 값이 온다.
 *
 * <p>{@code p256dh} 와 {@code auth} 는 브라우저가 만든 공개 키와 인증 비밀이다. 보내는 쪽이 이 둘로
 * 페이로드를 암호화하며 서버는 복호화하지 않는다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class PushSubscription {

    // 식별자
    @NonNull private final UUID id;

    // 이 자리를 가진 사용자
    @NonNull private final UUID userId;

    // 푸시 서비스가 발급한 주소
    @NonNull private final String endpoint;

    // 브라우저의 공개 키
    @NonNull private final String p256dh;

    // 브라우저의 인증 비밀
    @NonNull private final String auth;

    // 등록한 시각
    @NonNull private final Instant createdAt;

    public static PushSubscription register(
            UUID id, UUID userId, String endpoint, String p256dh, String auth, Instant now) {
        return new PushSubscription(id, userId, endpoint, p256dh, auth, now);
    }

    public static PushSubscription restore(
            UUID id, UUID userId, String endpoint, String p256dh, String auth, Instant createdAt) {
        return new PushSubscription(id, userId, endpoint, p256dh, auth, createdAt);
    }
}
