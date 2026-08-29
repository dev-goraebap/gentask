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

    // 역할
    @NonNull private Role role;

    // 만든 시각
    @NonNull private final Instant createdAt;

    // 고친 시각
    @NonNull private Instant updatedAt;

    /** 가입은 늘 일반 사용자로 시작한다. 관리자는 이미 관리자인 사람이 올려서만 된다. */
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
