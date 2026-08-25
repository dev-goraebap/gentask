package dev.goraebap.refarch.module.user.domain.user;

import dev.goraebap.refarch.module.user.domain.Email;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class User {

    // 식별자
    @NonNull private final UUID id;

    // 이메일
    @NonNull private final Email email;

    // 별명
    @NonNull private Nickname nickname;

    // 프로필 이미지의 보관 키. 없으면 기본 아바타다
    private String profileImageKey;

    // 만든 시각
    @NonNull private final Instant createdAt;

    // 고친 시각
    @NonNull private Instant updatedAt;

    public static User create(UUID id, Email email, Nickname nickname, Instant now) {
        return new User(id, email, nickname, null, now, now);
    }

    public static User restore(
            UUID id, Email email, Nickname nickname, String profileImageKey, Instant createdAt, Instant updatedAt) {
        return new User(id, email, nickname, profileImageKey, createdAt, updatedAt);
    }

    public void changeNickname(@NonNull Nickname nickname, Instant now) {
        this.nickname = nickname;
        this.updatedAt = now;
    }

    public void changeProfileImage(@NonNull String profileImageKey, Instant now) {
        this.profileImageKey = profileImageKey;
        this.updatedAt = now;
    }

    public void clearProfileImage(Instant now) {
        this.profileImageKey = null;
        this.updatedAt = now;
    }
}
