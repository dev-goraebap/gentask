package dev.goraebap.refarch.shared.storage;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 올리기 자리. 클라이언트는 url 로 PUT 하고 objectKey 로 확정한다.
 *
 * 화면 응답이 shared 에 있는 이유는 이 모양이 도메인이 아니라 presigned 절차의 것이라서다.
 * 프로필 이미지와 작업 파일이 같은 절차를 지나므로 응답도 한 벌이다.
 */
@Schema(name = "PresignedUpload")
public record PresignedUpload(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String objectKey,

        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String url) {}
