package dev.goraebap.refarch.module.task.domain;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 작업에 붙인 파일 (TK-003 A11). 바이트는 보관소가 갖고 여기는 목록의 한 줄이다.
 *
 * 붙인 뒤 고치는 조작이 없어 전체가 불변이다. 다른 파일로 바꾸는 것은 떼고 다시 붙이는 것이다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class TaskFile {

    // 식별자
    @NonNull private final UUID id;

    // 붙인 작업
    @NonNull private final UUID taskId;

    // 사용자가 올린 이름. 내려받을 때 이 이름으로 돌려준다
    @NonNull private final String fileName;

    // 미디어 타입
    @NonNull private final String contentType;

    // 바이트 수. 보관소의 실측이다
    private final long fileSize;

    // 보관소의 키
    @NonNull private final String objectKey;

    // 붙인 시각
    @NonNull private final Instant createdAt;

    public static TaskFile attach(
            UUID id, UUID taskId, String fileName, String contentType, long fileSize, String objectKey, Instant now) {
        return new TaskFile(id, taskId, fileName, contentType, fileSize, objectKey, now);
    }

    /** 저장소만 호출한다. */
    public static TaskFile restore(
            UUID id,
            UUID taskId,
            String fileName,
            String contentType,
            long fileSize,
            String objectKey,
            Instant createdAt) {
        return new TaskFile(id, taskId, fileName, contentType, fileSize, objectKey, createdAt);
    }
}
