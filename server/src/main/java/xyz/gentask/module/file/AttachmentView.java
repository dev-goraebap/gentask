package xyz.gentask.module.file;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

/**
 * 붙은 첨부 하나. 공개 언어(Published Language)이며 내부 엔티티를 대신해 모듈 밖으로 나간다.
 *
 * url 은 그 자리에서 발급한 내려받기 주소이며 수명이 있다. 저장해 두고 다시 쓰지 않는다.
 */
@Schema(name = "AttachmentView")
public record AttachmentView(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) UUID id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String fileName,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String contentType,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) long size,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String url,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt) {}
