package dev.goraebap.refarch.module.task.application.file;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

public final class TaskFileViews {

    private TaskFileViews() {}

    @Schema(name = "TaskFileView")
    public record TaskFileView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            UUID id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String fileName,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String contentType,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            long size,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String url,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Instant createdAt) {}
}
