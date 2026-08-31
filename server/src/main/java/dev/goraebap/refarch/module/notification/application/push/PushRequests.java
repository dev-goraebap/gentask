package dev.goraebap.refarch.module.notification.application.push;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class PushRequests {

    private PushRequests() {}

    /** 브라우저가 만든 구독을 그대로 옮긴다. 값의 형식은 푸시 서비스가 정한다. */
    public record RegisterPushSubscription(
            @NotBlank @Size(max = 1000) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String endpoint,

            @NotBlank @Size(max = 255) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String p256dh,

            @NotBlank @Size(max = 255) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String auth) {}

    public record UnregisterPushSubscription(
            @NotBlank @Size(max = 1000) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String endpoint) {}
}
