package xyz.gentask.module.user.domain.account;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;
import xyz.gentask.module.user.domain.Email;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Account {

    public static final String CREDENTIAL = "credential";

    @NonNull private final UUID id;

    @NonNull private final UUID userId;

    @NonNull private final String provider;

    @NonNull private final String providerAccountId;

    private String passwordHash;

    @NonNull private final Instant createdAt;

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

    /**
     * 비밀번호 해시를 변경한다.
     */
    public void changePassword(String newPasswordHash, Instant now) {
        if (!CREDENTIAL.equals(provider)) {
            throw new IllegalStateException("비밀번호를 갖지 않는 자격입니다");
        }
        this.passwordHash = newPasswordHash;
        this.updatedAt = now;
    }
}
