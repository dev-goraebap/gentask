package dev.goraebap.refarch.shared.storage;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "PresignedUpload")
public record PresignedUpload(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String objectKey,

        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String url) {}
