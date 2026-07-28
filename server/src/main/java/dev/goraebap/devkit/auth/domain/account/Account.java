package dev.goraebap.devkit.auth.domain.account;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * 인증 수단 애그리거트 — 인증 수단 하나가 한 행이다 (AUTH-06).
 *
 * <p>불변식: 비밀번호 해시는 {@code credential} 계정에만 존재한다. 소셜 계정의 제공자 토큰은
 * 제공자 API 호출용이며 클라이언트로 나가지 않는다 (결정-0014 §결과).
 */
public final class Account {

    private final UUID id;
    private final UUID userId;
    private final AuthProvider provider;
    private final String providerAccountId;
    private final String passwordHash;
    private final String accessToken;
    private final String refreshToken;
    private final Instant tokenExpiresAt;
    private final Instant createdAt;
    private Instant updatedAt;

    private Account(
            UUID id,
            UUID userId,
            AuthProvider provider,
            String providerAccountId,
            String passwordHash,
            String accessToken,
            String refreshToken,
            Instant tokenExpiresAt,
            Instant createdAt,
            Instant updatedAt) {
        this.id = Objects.requireNonNull(id);
        this.userId = Objects.requireNonNull(userId);
        this.provider = Objects.requireNonNull(provider);
        this.providerAccountId = Objects.requireNonNull(providerAccountId);
        if (provider == AuthProvider.CREDENTIAL && (passwordHash == null || passwordHash.isBlank())) {
            throw new IllegalArgumentException("credential 계정에는 비밀번호 해시가 있어야 한다");
        }
        if (provider != AuthProvider.CREDENTIAL && passwordHash != null) {
            throw new IllegalArgumentException("비밀번호는 credential 계정에만 실린다");
        }
        this.passwordHash = passwordHash;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiresAt = tokenExpiresAt;
        this.createdAt = Objects.requireNonNull(createdAt);
        this.updatedAt = Objects.requireNonNull(updatedAt);
    }

    /** 로컬(이메일/비밀번호) 인증 수단. 제공자 식별자는 사용자 id의 문자열이다 (설계/데이터베이스.md §2.3). */
    public static Account credential(UUID id, UUID userId, String passwordHash, Instant now) {
        return new Account(
                id, userId, AuthProvider.CREDENTIAL, userId.toString(), passwordHash, null, null, null, now, now);
    }

    /** 저장소 전용 재구성. */
    public static Account restore(
            UUID id,
            UUID userId,
            AuthProvider provider,
            String providerAccountId,
            String passwordHash,
            String accessToken,
            String refreshToken,
            Instant tokenExpiresAt,
            Instant createdAt,
            Instant updatedAt) {
        return new Account(
                id,
                userId,
                provider,
                providerAccountId,
                passwordHash,
                accessToken,
                refreshToken,
                tokenExpiresAt,
                createdAt,
                updatedAt);
    }

    public UUID id() {
        return id;
    }

    public UUID userId() {
        return userId;
    }

    public AuthProvider provider() {
        return provider;
    }

    public String providerAccountId() {
        return providerAccountId;
    }

    public String passwordHash() {
        return passwordHash;
    }

    public String accessToken() {
        return accessToken;
    }

    public String refreshToken() {
        return refreshToken;
    }

    public Instant tokenExpiresAt() {
        return tokenExpiresAt;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }
}
