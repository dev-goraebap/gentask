package dev.goraebap.refarch.module.notification.application.failure;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AdminPushViews {

    private AdminPushViews() {}

    @Schema(name = "PushFailureView")
    public record PushFailureView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            UUID id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            UUID userId,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    description = "지워진 사용자이면 없다")
            String email,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"})
            String nickname,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String endpoint,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "uuid")
            UUID taskId,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    allowableValues = {"FAILED", "GONE"})
            String reason,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"})
            String detail,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Instant occurredAt,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "date-time")
            Instant resolvedAt) {}

    @Schema(name = "PushFailurePageView")
    public record PushFailurePageView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            List<PushFailureView> items,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            long total,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int page,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int size) {

        /** 담아 온 목록을 그대로 쥐지 않는다. 부르는 쪽이 뒤에 고치면 이 값이 함께 바뀐다. */
        public PushFailurePageView {
            items = List.copyOf(items);
        }
    }
}
