package dev.goraebap.refarch.module.file.application;

import dev.goraebap.refarch.module.file.AttachmentSlot;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public final class AttachmentRequests {

    private AttachmentRequests() {}

    public record PresignAttachment(
            @NotNull @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            AttachmentSlot slot,

            @NotBlank @Size(max = 255) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String fileName,

            @NotBlank @Size(max = 100) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String contentType,

            @NotNull @Positive @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Long size) {}
}
