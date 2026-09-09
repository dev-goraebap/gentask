package xyz.gentask.module.file.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import xyz.gentask.module.file.AttachmentSlot;

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
            Long size,

            @Pattern(regexp = "^#[0-9a-fA-F]{6}$") @Schema(description = "이미지 배경에 사용할 대표색. 선택 사항이며 #RRGGBB 형식이다.")
            String dominantColor,

            @Positive @Max(1000000) @Schema(description = "원본 이미지 너비(px)")
            Integer width,

            @Positive @Max(1000000) @Schema(description = "원본 이미지 높이(px)")
            Integer height) {}
}
