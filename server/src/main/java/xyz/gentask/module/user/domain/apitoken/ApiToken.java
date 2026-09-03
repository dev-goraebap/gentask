package xyz.gentask.module.user.domain.apitoken;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class ApiToken {

    @NonNull private final UUID id;

    @NonNull private final UUID userId;

    @NonNull private final String tokenHash;

    @NonNull private final Instant createdAt;

    public static ApiToken issue(UUID id, UUID userId, String tokenHash, Instant now) {
        return new ApiToken(id, userId, tokenHash, now);
    }

    public static ApiToken restore(UUID id, UUID userId, String tokenHash, Instant createdAt) {
        return new ApiToken(id, userId, tokenHash, createdAt);
    }
}
