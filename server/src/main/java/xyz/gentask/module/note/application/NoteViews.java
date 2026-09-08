package xyz.gentask.module.note.application;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import xyz.gentask.module.file.AttachmentView;

public final class NoteViews {
    private NoteViews() {}

    public record NoteView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String body,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"})
            String projectId,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"})
            String projectName,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            boolean shared,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            UUID ownerId,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String authorName,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Instant createdAt,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Instant updatedAt,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            List<AttachmentView> files) {
        public NoteView {
            files = List.copyOf(files);
        }
    }

    public record NotePage(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            List<NoteView> items,

            Integer nextOffset) {
        public NotePage {
            items = List.copyOf(items);
        }
    }
}
