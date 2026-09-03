package xyz.gentask.module.file.domain.pending;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 발급 후 실제 엔터티에 첨부되지 않은 대기 상태의 업로드 엔터티다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class PendingUpload {

    @NonNull private final UUID id;

    @NonNull private final String storageKey;

    @NonNull private final String slot;

    @NonNull private final String fileName;

    @NonNull private final String contentType;

    @NonNull private final UUID issuedBy;

    @NonNull private final Instant createdAt;

    public static PendingUpload issue(
            UUID id, String storageKey, String slot, String fileName, String contentType, UUID issuedBy, Instant now) {
        return new PendingUpload(id, storageKey, slot, fileName, contentType, issuedBy, now);
    }

    public static PendingUpload restore(
            UUID id,
            String storageKey,
            String slot,
            String fileName,
            String contentType,
            UUID issuedBy,
            Instant createdAt) {
        return new PendingUpload(id, storageKey, slot, fileName, contentType, issuedBy, createdAt);
    }

    /** 지정한 발급 위치 및 발급 사용자와 일치하는지 검증한다. */
    public boolean isIssued(String targetSlot, UUID actorId) {
        return slot.equals(targetSlot) && issuedBy.equals(actorId);
    }
}
