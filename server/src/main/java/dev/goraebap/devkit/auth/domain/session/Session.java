package dev.goraebap.devkit.auth.domain.session;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * 세션 애그리거트 (결정-0014).
 *
 * <p>토큰은 불투명한 난수이며 여기에는 HMAC 다이제스트만 저장된다 — DB 유출이 활성 세션을 그대로
 * 넘기지 않게 한다 (설계/데이터베이스.md §1.4). 무효화는 행 삭제로 즉시 반영된다.
 */
public final class Session {

    private final UUID id;
    private final UUID userId;
    private final String tokenHash;
    private Instant expiresAt;
    private Instant lastUsedAt;
    private final String ipAddress;
    private final String userAgent;
    private final Instant createdAt;

    private Session(
            UUID id,
            UUID userId,
            String tokenHash,
            Instant expiresAt,
            Instant lastUsedAt,
            String ipAddress,
            String userAgent,
            Instant createdAt) {
        this.id = Objects.requireNonNull(id);
        this.userId = Objects.requireNonNull(userId);
        this.tokenHash = Objects.requireNonNull(tokenHash);
        this.expiresAt = Objects.requireNonNull(expiresAt);
        this.lastUsedAt = Objects.requireNonNull(lastUsedAt);
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.createdAt = Objects.requireNonNull(createdAt);
    }

    public static Session issue(
            UUID id, UUID userId, String tokenHash, Instant now, Duration ttl, String ipAddress, String userAgent) {
        return new Session(id, userId, tokenHash, now.plus(ttl), now, ipAddress, userAgent, now);
    }

    /** 발급 시점 기준 절대 상한. 슬라이딩 연장이 이 시각을 넘지 못한다. */
    public Instant absoluteExpiryAt(Duration absoluteTtl) {
        return createdAt.plus(absoluteTtl);
    }

    /** 저장소 전용 재구성. */
    public static Session restore(
            UUID id,
            UUID userId,
            String tokenHash,
            Instant expiresAt,
            Instant lastUsedAt,
            String ipAddress,
            String userAgent,
            Instant createdAt) {
        return new Session(id, userId, tokenHash, expiresAt, lastUsedAt, ipAddress, userAgent, createdAt);
    }

    public boolean isExpired(Instant now) {
        return !now.isBefore(expiresAt);
    }

    /**
     * 슬라이딩 만료 (결정-0014 §결정 4). 마지막 사용 후 {@code touchInterval}이 지났을 때만 만료를
     * 연장한다 — 요청마다 쓰기가 발생하는 것을 막는다. 갱신 여부를 반환하며, 호출자는 참일 때만
     * 저장하면 된다.
     *
     * <p>연장은 발급 시점 기준 {@code absoluteTtl}을 넘지 못한다. 상한이 없으면 계속 쓰이는 세션이
     * 영구 유효해져, 한 번 탈취된 토큰이 만료로 회수되지 않는다.
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

    public UUID id() {
        return id;
    }

    public UUID userId() {
        return userId;
    }

    public String tokenHash() {
        return tokenHash;
    }

    public Instant expiresAt() {
        return expiresAt;
    }

    public Instant lastUsedAt() {
        return lastUsedAt;
    }

    public String ipAddress() {
        return ipAddress;
    }

    public String userAgent() {
        return userAgent;
    }

    public Instant createdAt() {
        return createdAt;
    }
}
