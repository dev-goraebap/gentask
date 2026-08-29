package dev.goraebap.refarch.module.file.domain.blob;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 보관소에 올라간 파일 하나. 어디에 붙었는지는 갖지 않으며 그것은 첨부가 갖는다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Blob {

    // 식별자
    @NonNull private final UUID id;

    // 보관소의 키
    @NonNull private final String storageKey;

    // 사용자가 올린 이름. 내려받을 때 이 이름으로 돌려준다
    @NonNull private final String fileName;

    // 미디어 타입
    @NonNull private final String contentType;

    // 바이트 수. 보관소의 실측이다
    private final long byteSize;

    // 올린 시각
    @NonNull private final Instant createdAt;

    public static Blob store(
            UUID id, String storageKey, String fileName, String contentType, long byteSize, Instant now) {
        return new Blob(id, storageKey, fileName, contentType, byteSize, now);
    }

    public static Blob restore(
            UUID id, String storageKey, String fileName, String contentType, long byteSize, Instant createdAt) {
        return new Blob(id, storageKey, fileName, contentType, byteSize, createdAt);
    }
}
