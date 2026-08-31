package dev.goraebap.refarch.module.user.application.admin;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AdminViews {

    private AdminViews() {}

    @Schema(name = "AdminUserView")
    public record AdminUserView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            UUID id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String email,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String nickname,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    allowableValues = {"USER", "ADMIN"})
            String role,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Instant createdAt) {}

    @Schema(name = "AdminUserPageView")
    public record AdminUserPageView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            List<AdminUserView> items,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            long total,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int page,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int size) {

        /** 담아 온 목록을 그대로 쥐지 않는다. 부르는 쪽이 뒤에 고치면 이 값이 함께 바뀐다. */
        public AdminUserPageView {
            items = List.copyOf(items);
        }
    }
}
