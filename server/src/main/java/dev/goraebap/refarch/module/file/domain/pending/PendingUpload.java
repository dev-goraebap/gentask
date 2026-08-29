package dev.goraebap.refarch.module.file.domain.pending;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 발급만 하고 아직 붙지 않은 업로드. 보관소에는 객체가 있으나 어디에도 매이지 않은 상태다.
 *
 * <p>붙일 때 이 행으로 owner 일치를 확인한다. 보관소 키의 접두어를 검사하는 방식은 키 형식이 owner 를
 * 담고 있어야만 성립하므로 두지 않는다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class PendingUpload {

    // 식별자
    @NonNull private final UUID id;

    // 보관소의 키
    @NonNull private final String storageKey;

    // 붙을 레코드의 종류
    @NonNull private final String ownerType;

    // 붙을 레코드의 식별자
    @NonNull private final UUID ownerId;

    // 붙을 자리의 이름
    @NonNull private final String name;

    // 사용자가 올린 이름
    @NonNull private final String fileName;

    // 미디어 타입
    @NonNull private final String contentType;

    // 발급 시각. 청소가 이 값을 근거로 삼는다
    @NonNull private final Instant createdAt;

    public static PendingUpload issue(
            UUID id,
            String storageKey,
            String ownerType,
            UUID ownerId,
            String name,
            String fileName,
            String contentType,
            Instant now) {
        return new PendingUpload(id, storageKey, ownerType, ownerId, name, fileName, contentType, now);
    }

    public static PendingUpload restore(
            UUID id,
            String storageKey,
            String ownerType,
            UUID ownerId,
            String name,
            String fileName,
            String contentType,
            Instant createdAt) {
        return new PendingUpload(id, storageKey, ownerType, ownerId, name, fileName, contentType, createdAt);
    }

    /** 발급받은 자리와 붙이려는 자리가 같은지. */
    public boolean isAt(String targetOwnerType, UUID targetOwnerId, String targetName) {
        return ownerType.equals(targetOwnerType) && ownerId.equals(targetOwnerId) && name.equals(targetName);
    }
}
