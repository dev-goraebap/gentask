package xyz.gentask.module.note.application;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoteStore {
    record NoteRecord(
            String id,
            String body,
            String projectId,
            String projectName,
            boolean shared,
            UUID ownerId,
            String authorName,
            Instant createdAt,
            Instant updatedAt) {}

    boolean insert(String id, UUID ownerId, String projectId, String body, Instant now);

    Optional<NoteRecord> find(String id, boolean lock);

    List<NoteRecord> list(UUID userId, String projectId, String search, int offset, int limit);

    void edit(String id, String body, Instant now);

    void connect(String id, String projectId, Instant now);

    void share(String id, boolean shared, Instant now);

    void delete(String id);
}
