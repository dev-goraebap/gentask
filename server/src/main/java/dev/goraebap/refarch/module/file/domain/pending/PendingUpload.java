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
 * <p>붙을 대상을 갖지 않는다. 자리 발급은 보관소에 자리를 잡는 일일 뿐이고 어느 레코드에 붙을지는 그때
 * 정해지지 않기 때문이다. 대신 발급한 사람을 갖는다 — 붙일 때 발급자와 붙이는 사람이 같은지 본다.
 *
 * <p>그 레코드에 붙일 자격이 있는지는 여기서 판정하지 않는다. 소유 모듈이 그 앞에서 판정한다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class PendingUpload {

    // 식별자
    @NonNull private final UUID id;

    // 보관소의 키
    @NonNull private final String storageKey;

    // 발급받은 자리. 크기와 형식의 정책이 이 값에 매인다
    @NonNull private final String slot;

    // 사용자가 올린 이름
    @NonNull private final String fileName;

    // 미디어 타입
    @NonNull private final String contentType;

    // 발급받은 사람
    @NonNull private final UUID issuedBy;

    // 발급 시각. 청소가 이 값을 근거로 삼는다
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

    /** 그 자리에 그 사람이 발급받은 것인지. 둘 중 하나라도 어긋나면 붙일 수 없다. */
    public boolean isIssued(String targetSlot, UUID actorId) {
        return slot.equals(targetSlot) && issuedBy.equals(actorId);
    }
}
