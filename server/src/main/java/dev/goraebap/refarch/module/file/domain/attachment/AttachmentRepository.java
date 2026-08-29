package dev.goraebap.refarch.module.file.domain.attachment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttachmentRepository {

    void save(Attachment attachment);

    List<Attachment> findBySlot(String ownerType, UUID ownerId, String name);

    Optional<Attachment> findById(UUID attachmentId);

    int countBySlot(String ownerType, UUID ownerId, String name);

    void deleteById(UUID attachmentId);
}
