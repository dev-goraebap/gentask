package dev.goraebap.refarch.module.user.application;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

public final class UserViews {

    private UserViews() {}

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

    @Schema(name = "IssuedApiToken")
    public record IssuedApiToken(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String token,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Instant issuedAt) {}
}
