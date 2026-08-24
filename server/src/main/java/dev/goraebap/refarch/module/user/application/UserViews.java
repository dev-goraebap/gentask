package dev.goraebap.refarch.module.user.application;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

public final class UserViews {

    private UserViews() {}

    /**
     * 로그인한 사용자 자신이다. 다른 사용자를 보는 화면이 없으므로 이 뷰 하나뿐이다.
     *
     * profileImageUrl 은 presigned GET 이라 수명이 있다. 화면은 저장하지 않고 그때그때 받는다.
     * apiToken 원문은 여기 없다 — 발급 응답에만 실린다(TK-006 A3).
     */
    @Schema(name = "MeView")
    public record MeView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            UUID id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String email,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String nickname,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"})
            String profileImageUrl,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "date-time")
            Instant apiTokenIssuedAt,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Instant createdAt) {}

    /** 토큰 원문이 실리는 유일한 응답이다. */
    @Schema(name = "IssuedApiToken")
    public record IssuedApiToken(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String token,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Instant issuedAt) {}
}
