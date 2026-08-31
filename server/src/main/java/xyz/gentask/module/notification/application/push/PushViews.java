package xyz.gentask.module.notification.application.push;

import io.swagger.v3.oas.annotations.media.Schema;

public final class PushViews {

    private PushViews() {}

    /** 브라우저가 구독을 만들 때 필요한 값. 개인 키는 담기지 않는다. */
    @Schema(name = "PushConfigView")
    public record PushConfigView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String publicKey) {}

    @Schema(name = "PushSubscriptionStateView")
    public record PushSubscriptionStateView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            boolean registered) {}
}
