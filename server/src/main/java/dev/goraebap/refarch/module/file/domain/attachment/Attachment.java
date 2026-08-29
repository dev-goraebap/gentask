package dev.goraebap.refarch.module.file.domain.attachment;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 파일 하나가 어느 도메인 레코드의 어느 자리에 붙었는지를 갖는 다형 연결.
 *
 * <p>{@code ownerType} 과 {@code name} 을 문자열로 갖는 것은 그 값의 목록을 모듈 밖의 공개 언어가
 * 소유하기 때문이다. 도메인이 그것을 열거로 다시 가지면 창구를 거꾸로 참조하게 된다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Attachment {

    // 식별자
    @NonNull private final UUID id;

    // 붙인 파일
    @NonNull private final UUID blobId;

    // 붙은 레코드의 종류
    @NonNull private final String ownerType;

    // 붙은 레코드의 식별자. 외래 키를 걸지 않는다 — 대상 표가 행마다 다르다
    @NonNull private final UUID ownerId;

    // 붙은 자리의 이름
    @NonNull private final String name;

    // 붙인 시각
    @NonNull private final Instant createdAt;

    public static Attachment attach(UUID id, UUID blobId, String ownerType, UUID ownerId, String name, Instant now) {
        return new Attachment(id, blobId, ownerType, ownerId, name, now);
    }

    public static Attachment restore(
            UUID id, UUID blobId, String ownerType, UUID ownerId, String name, Instant createdAt) {
        return new Attachment(id, blobId, ownerType, ownerId, name, createdAt);
    }

    /** 그 자리에 붙어 있는지. */
    public boolean isAt(String targetOwnerType, UUID targetOwnerId, String targetName) {
        return ownerType.equals(targetOwnerType) && ownerId.equals(targetOwnerId) && name.equals(targetName);
    }
}
