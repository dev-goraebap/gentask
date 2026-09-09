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
            boolean archived,
            UUID ownerId,
            String authorName,
            Instant createdAt,
            Instant updatedAt) {}

    boolean insert(String id, UUID ownerId, String projectId, String body, Instant now);

    Optional<NoteRecord> find(String id, boolean lock);

    List<NoteRecord> list(
            UUID userId,
            String projectId,
            boolean personal,
            String search,
            int offset,
            int limit,
            String sort,
            String archive,
            String tag);

    void edit(String id, String body, Instant now);

    void connect(String id, String projectId, Instant now);

    void share(String id, boolean shared, Instant now);

    void archive(String id, boolean archived, Instant now);

    List<String> tags(String id);

    void tags(String id, List<String> tags);

    List<xyz.gentask.module.note.NoteReferenceIn.Reference> references(UUID userId, String projectId, List<String> ids);

    void delete(String id);
}
