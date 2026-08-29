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

    // 만든 시각
    @NonNull private final Instant createdAt;

    // 고친 시각
    @NonNull private Instant updatedAt;

    public static User create(UUID id, Email email, Nickname nickname, Instant now) {
        return new User(id, email, nickname, now, now);
    }

    public static User restore(UUID id, Email email, Nickname nickname, Instant createdAt, Instant updatedAt) {
        return new User(id, email, nickname, createdAt, updatedAt);
    }

    public void changeNickname(@NonNull Nickname nickname, Instant now) {
        this.nickname = nickname;
        this.updatedAt = now;
    }
}
