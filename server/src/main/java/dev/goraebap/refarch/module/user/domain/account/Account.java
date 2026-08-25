package dev.goraebap.refarch.module.user.domain.account;

import dev.goraebap.refarch.module.user.domain.Email;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Account {

    public static final String CREDENTIAL = "credential";

    // 식별자
    @NonNull private final UUID id;

    // 소유자
    @NonNull private final UUID userId;

    // 자격의 종류
    @NonNull private final String provider;

    // 그 종류 안에서의 식별자
    @NonNull private final String providerAccountId;

    // 비밀번호 해시. credential 에서만 값을 갖는다
    private String passwordHash;

    // 만든 시각
    @NonNull private final Instant createdAt;

    // 고친 시각
    @NonNull private Instant updatedAt;

    public static Account createCredential(UUID id, UUID userId, Email email, String passwordHash, Instant now) {
        return new Account(id, userId, CREDENTIAL, email.normalized(), passwordHash, now, now);
    }

    public static Account restore(
            UUID id,
            UUID userId,
            String provider,
            String providerAccountId,
            String passwordHash,
            Instant createdAt,
            Instant updatedAt) {
        return new Account(id, userId, provider, providerAccountId, passwordHash, createdAt, updatedAt);
    }
}
