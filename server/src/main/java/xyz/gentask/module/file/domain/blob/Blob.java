package xyz.gentask.module.file.domain.blob;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 스토리지에 저장된 원본 파일 메타데이터 엔터티다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Blob {

    @NonNull private final UUID id;

    @NonNull private final String storageKey;

    @NonNull private final String fileName;

    @NonNull private final String contentType;

    private final long byteSize;

    @NonNull private final Instant createdAt;

    private final String dominantColor;
    private final Integer width;
    private final Integer height;

    public static Blob store(
            UUID id,
            String storageKey,
            String fileName,
            String contentType,
            long byteSize,
            Instant now,
            String dominantColor,
            Integer width,
            Integer height) {
        return new Blob(id, storageKey, fileName, contentType, byteSize, now, dominantColor, width, height);
    }

    public static Blob restore(
            UUID id,
            String storageKey,
            String fileName,
            String contentType,
            long byteSize,
            Instant createdAt,
            String dominantColor,
            Integer width,
            Integer height) {
        return new Blob(id, storageKey, fileName, contentType, byteSize, createdAt, dominantColor, width, height);
    }
}
