package dev.goraebap.refarch.module.user.domain;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 로그인 상태 (TK-005). 토큰 원문이 아니라 해시를 갖는다.
 *
 * 만료는 슬라이딩이다. 쓰는 동안 늘어나되 만든 시점부터의 절대 상한을 넘지 않는다.
 * 정책 값(TTL · 상한 · touch 간격)은 시간대와 설정을 아는 쪽이 넘긴다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Session {

    // 식별자
    @NonNull private final UUID id;

    // 소유자
    @NonNull private final UUID userId;

    // 토큰의 HMAC-SHA256 hex
    @NonNull private final String tokenHash;

    // 만료 시각
    @NonNull private Instant expiresAt;

    // 마지막으로 쓴 시각
    @NonNull private Instant lastUsedAt;

    // 만든 시각
    @NonNull private final Instant createdAt;

    public static Session issue(UUID id, UUID userId, String tokenHash, Instant now, Duration ttl) {
        return new Session(id, userId, tokenHash, now.plus(ttl), now, now);
    }

    /** 저장소만 호출한다. 검증을 지나지 않는다. */
    public static Session restore(
            UUID id, UUID userId, String tokenHash, Instant expiresAt, Instant lastUsedAt, Instant createdAt) {
        return new Session(id, userId, tokenHash, expiresAt, lastUsedAt, createdAt);
    }

    public boolean isExpired(Instant now) {
        return !now.isBefore(expiresAt);
    }

    /**
     * 만료를 밀어 준다. 늘렸으면 참을 돌려주고, 그때만 저장하면 된다.
     *
     * touch 간격 안의 요청에는 아무것도 하지 않는다. 요청마다 쓰기가 나가면 조회가
     * 조회로 끝나지 않는다.
     */
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
