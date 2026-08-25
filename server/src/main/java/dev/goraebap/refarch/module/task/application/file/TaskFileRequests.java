package dev.goraebap.refarch.module.task.application.file;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public final class TaskFileRequests {

    private TaskFileRequests() {}

    /** TK-003 A11. 크기를 미리 받아 올리기 전에 거절한다. 강제는 확정 시점의 실측이 한다. */
    public record PresignTaskFile(
            @NotBlank @Size(max = 255) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String fileName,

            @NotBlank @Size(max = 100) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String contentType,

            @NotNull @Positive @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Long size) {}

    /** presign 이 준 키로 붙임을 확정한다. 크기는 다시 받지 않는다 — 보관소의 실측을 쓴다. */
    public record AttachTaskFile(
            @NotBlank @Size(max = 400) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String objectKey,

            @NotBlank @Size(max = 255) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String fileName,

            @NotBlank @Size(max = 100) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String contentType) {}
}
