package dev.goraebap.refarch.module.task.application.file;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

public final class TaskFileViews {

    private TaskFileViews() {}

    /** url 은 presigned GET 이라 수명이 있다. 화면은 저장하지 않고 목록을 받을 때마다 새 값을 얻는다. */
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
