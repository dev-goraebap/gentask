package xyz.gentask.shared.storage;

import java.time.Duration;
import java.util.Optional;

public interface ObjectStorage {

    String presignPut(String objectKey, String contentType, Duration expiry);

    String presignGet(String objectKey, String downloadFileName, Duration expiry);

    Optional<Long> sizeOf(String objectKey);

    void delete(String objectKey);
}
