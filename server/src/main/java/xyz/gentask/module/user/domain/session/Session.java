package xyz.gentask.module.user.domain.session;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Session {

    @NonNull private final UUID id;

    @NonNull private final UUID userId;

    @NonNull private final String tokenHash;

    @NonNull private Instant expiresAt;

    @NonNull private Instant lastUsedAt;

    @NonNull private final Instant createdAt;

    public static Session issue(UUID id, UUID userId, String tokenHash, Instant now, Duration ttl) {
        return new Session(id, userId, tokenHash, now.plus(ttl), now, now);
    }

    public static Session restore(
            UUID id, UUID userId, String tokenHash, Instant expiresAt, Instant lastUsedAt, Instant createdAt) {
        return new Session(id, userId, tokenHash, expiresAt, lastUsedAt, createdAt);
    }

    public boolean isExpired(Instant now) {
        return !now.isBefore(expiresAt);
    }

    public boolean touch(Instant now, Duration ttl, Duration absoluteTtl, Duration touchInterval) {
        if (isExpired(now) || now.isBefore(lastUsedAt.plus(touchInterval))) {
            return false;
        }
        Instant limit = createdAt.plus(absoluteTtl);
        Instant extended = now.plus(ttl);
        this.lastUsedAt = now;
        this.expiresAt = extended.isAfter(limit) ? limit : extended;
        return true;
    }
}
