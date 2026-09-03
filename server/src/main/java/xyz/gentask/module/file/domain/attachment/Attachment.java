package xyz.gentask.module.file.domain.attachment;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 도메인 레코드와 업로드된 파일을 매핑하는 다형 첨부 엔터티다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Attachment {

    @NonNull private final UUID id;

    @NonNull private final UUID blobId;

    @NonNull private final String ownerType;

    @NonNull private final UUID ownerId;

    @NonNull private final String name;

    @NonNull private final Instant createdAt;

    public static Attachment attach(UUID id, UUID blobId, String ownerType, UUID ownerId, String name, Instant now) {
        return new Attachment(id, blobId, ownerType, ownerId, name, now);
    }

    public static Attachment restore(
            UUID id, UUID blobId, String ownerType, UUID ownerId, String name, Instant createdAt) {
        return new Attachment(id, blobId, ownerType, ownerId, name, createdAt);
    }

    /** 지정한 첨부 위치와 일치하는지 여부를 반환한다. */
    public boolean isAt(String targetOwnerType, UUID targetOwnerId, String targetName) {
        return ownerType.equals(targetOwnerType) && ownerId.equals(targetOwnerId) && name.equals(targetName);
    }
}
