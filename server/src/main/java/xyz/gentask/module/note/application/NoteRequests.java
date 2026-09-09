package xyz.gentask.module.note.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class NoteRequests {
    private NoteRequests() {}

    public record ArchiveNote(boolean archived) {}

    public record TagNote(@NotNull @Size(max = 10) List<@NotBlank @Size(max = 40) String> tags) {
        public TagNote {
            tags = tags == null ? null : java.util.Collections.unmodifiableList(new java.util.ArrayList<>(tags));
        }
    }

    public record CreateNote(
            @NotNull @Size(max = 50000) String body,
            @Size(min = 12, max = 12) String projectId,
            @Size(max = 5) List<@NotBlank @Size(max = 512) String> objectKeys) {
        public CreateNote {
            objectKeys = objectKeys == null
                    ? List.of()
                    : java.util.Collections.unmodifiableList(new java.util.ArrayList<>(objectKeys));
        }

        @Override
        public List<String> objectKeys() {
            return new java.util.ArrayList<>(objectKeys);
        }
    }

    public record EditNote(@NotNull @Size(max = 50000) String body) {}

    public record ConnectNote(@Size(min = 12, max = 12) String projectId) {}

    public record ShareNote(boolean shared) {}

    public record AttachNoteFile(@NotBlank @Size(max = 512) String objectKey) {}
}
