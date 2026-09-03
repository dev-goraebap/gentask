package xyz.gentask.module.user.domain.user;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;
import xyz.gentask.module.user.domain.Email;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class User {

    @NonNull private final UUID id;

    @NonNull private final Email email;

    @NonNull private Nickname nickname;

    @NonNull private Role role;

    @NonNull private final Instant createdAt;

    @NonNull private Instant updatedAt;

    /** 신규 가입 사용자는 기본 USER 역할로 생성된다. */
    public static User create(UUID id, Email email, Nickname nickname, Instant now) {
        return new User(id, email, nickname, Role.USER, now, now);
    }

    public static User restore(
            UUID id, Email email, Nickname nickname, Role role, Instant createdAt, Instant updatedAt) {
        return new User(id, email, nickname, role, createdAt, updatedAt);
    }

    public void changeNickname(@NonNull Nickname nickname, Instant now) {
        this.nickname = nickname;
        this.updatedAt = now;
    }

    public void changeRole(@NonNull Role role, Instant now) {
        this.role = role;
        this.updatedAt = now;
    }
}
