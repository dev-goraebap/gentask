package xyz.gentask.module.file.domain.pending;

import java.util.Optional;
import java.util.UUID;

public interface PendingUploadRepository {

    void save(PendingUpload pendingUpload);

    Optional<PendingUpload> findByStorageKey(String storageKey);

    void deleteById(UUID pendingUploadId);
}
