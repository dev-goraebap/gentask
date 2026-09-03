package xyz.gentask.module.notification.domain.subscription;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 기기 브라우저별 웹 푸시 구독 엔터티다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class PushSubscription {

    @NonNull private final UUID id;

    @NonNull private final UUID userId;

    @NonNull private final String endpoint;

    @NonNull private final String p256dh;

    @NonNull private final String auth;

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
