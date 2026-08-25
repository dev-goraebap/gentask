package dev.goraebap.refarch.module.user.domain.account;

import dev.goraebap.refarch.module.user.domain.Email;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 자격 수단 (TK-005). 지금은 credential(이메일 · 비밀번호) 하나다.
 *
 * User 와 가르는 이유는 소셜이 붙어도 사용자 쪽이 바뀌지 않게 하기 위해서다. 스키마와
 * 함께 devkit 을 준용한다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Account {

    /** credential 의 provider 값. providerAccountId 는 정규화 이메일이다. */
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

    /** TK-005 A1. */
    public static Account createCredential(UUID id, UUID userId, Email email, String passwordHash, Instant now) {
        return new Account(id, userId, CREDENTIAL, email.normalized(), passwordHash, now, now);
    }

    /** 저장소만 호출한다. 검증을 지나지 않는다. */
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
