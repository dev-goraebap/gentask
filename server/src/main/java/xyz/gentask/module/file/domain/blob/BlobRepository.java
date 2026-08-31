package xyz.gentask.module.file.domain.blob;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BlobRepository {

    void save(Blob blob);

    Optional<Blob> findById(UUID blobId);

    List<Blob> findAllById(Collection<UUID> blobIds);

    void deleteById(UUID blobId);
}
