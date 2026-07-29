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
    private String passwordHash;
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

    /**
     * 소셜 인증 수단 (AUTH-02·03).
     *
     * <p>{@code providerAccountId}는 제공자가 준 subject id다 — 구글 {@code sub}, 카카오 numeric id.
     * <b>이메일을 제공자 식별 키로 쓰지 않는다</b>(결정-0015 §결정 7): 사용자가 제공자 쪽에서
     * 이메일을 바꿔도 우리 계정과의 연결이 끊기지 않아야 하기 때문이다.
     *
     * <p>제공자 토큰은 그 제공자의 API를 부르기 위한 것이며 클라이언트로 나가지 않는다
     * (결정-0014 §결과).
     */
    public static Account social(
            UUID id,
            UUID userId,
            AuthProvider provider,
            String providerAccountId,
            String accessToken,
            String refreshToken,
            Instant tokenExpiresAt,
            Instant now) {
        if (provider == AuthProvider.CREDENTIAL) {
            throw new IllegalArgumentException("credential은 소셜 제공자가 아니다 — credential() 팩토리를 쓰라");
        }
        return new Account(
                id, userId, provider, providerAccountId, null, accessToken, refreshToken, tokenExpiresAt, now, now);
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

    /**
     * 비밀번호를 교체한다 (AUTH-07, PROF-03).
     *
     * <p>소셜 계정에는 비밀번호가 없어야 하므로 {@code credential}에만 허용한다 — 이 불변식은
     * 스키마의 체크 제약과 짝을 이룬다(설계/데이터베이스.md §2.3).
     */
    public void changePassword(String newPasswordHash, Instant now) {
        if (provider != AuthProvider.CREDENTIAL) {
            throw new IllegalStateException("비밀번호는 credential 계정에만 있다");
        }
        if (newPasswordHash == null || newPasswordHash.isBlank()) {
            throw new IllegalArgumentException("비밀번호 해시가 비어 있다");
        }
        this.passwordHash = newPasswordHash;
        this.updatedAt = Objects.requireNonNull(now);
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
