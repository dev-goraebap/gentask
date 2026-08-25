package dev.goraebap.refarch.module.user.domain.user;

import dev.goraebap.refarch.module.user.domain.Email;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/** 사용자 애그리거트 (TK-005 · TK-006). 자격 수단은 Account 가 따로 갖는다. */
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

    /** TK-005 A1. 이미지는 없는 채로 시작한다. */
    public static User create(UUID id, Email email, Nickname nickname, Instant now) {
        return new User(id, email, nickname, null, now, now);
    }

    /** 저장소만 호출한다. 검증을 지나지 않는다. */
    public static User restore(
            UUID id, Email email, Nickname nickname, String profileImageKey, Instant createdAt, Instant updatedAt) {
        return new User(id, email, nickname, profileImageKey, createdAt, updatedAt);
    }

    /** TK-006 기본 흐름. */
    public void changeNickname(@NonNull Nickname nickname, Instant now) {
        this.nickname = nickname;
        this.updatedAt = now;
    }

    /** TK-006 A1. 이전 이미지의 정리는 보관소를 아는 쪽의 일이다. */
    public void changeProfileImage(@NonNull String profileImageKey, Instant now) {
        this.profileImageKey = profileImageKey;
        this.updatedAt = now;
    }

    /** TK-006 A2. 기본 아바타로 돌아간다. */
    public void clearProfileImage(Instant now) {
        this.profileImageKey = null;
        this.updatedAt = now;
    }
}
