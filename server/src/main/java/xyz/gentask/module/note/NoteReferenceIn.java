package xyz.gentask.module.note;

import java.util.List;
import java.util.UUID;

public interface NoteReferenceIn {
    record Reference(String id, String preview, boolean archived) {}

    List<Reference> references(UUID userId, String projectId, List<String> ids);
}
