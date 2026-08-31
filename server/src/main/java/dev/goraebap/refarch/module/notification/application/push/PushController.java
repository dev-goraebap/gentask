package dev.goraebap.refarch.module.notification.application.push;

import dev.goraebap.refarch.module.notification.application.push.PushRequests.RegisterPushSubscription;
import dev.goraebap.refarch.module.notification.application.push.PushRequests.UnregisterPushSubscription;
import dev.goraebap.refarch.module.notification.application.push.PushViews.PushConfigView;
import dev.goraebap.refarch.module.notification.application.push.PushViews.PushSubscriptionStateView;
import dev.goraebap.refarch.shared.web.CurrentUser;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/push")
@RequiredArgsConstructor
public class PushController {

    private final PushSubscriptionService pushSubscriptionService;

    @GetMapping("/config")
    public PushConfigView config() {
        return new PushConfigView(pushSubscriptionService.publicKey());
    }

    @GetMapping("/subscription")
    public PushSubscriptionStateView state(@CurrentUser UUID userId, @RequestParam String endpoint) {
        return new PushSubscriptionStateView(pushSubscriptionService.isRegistered(userId, endpoint));
    }

    @PostMapping("/subscription")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void register(@CurrentUser UUID userId, @Valid @RequestBody RegisterPushSubscription request) {
        pushSubscriptionService.register(userId, request.endpoint(), request.p256dh(), request.auth());
    }

    @DeleteMapping("/subscription")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unregister(@CurrentUser UUID userId, @Valid @RequestBody UnregisterPushSubscription request) {
        pushSubscriptionService.unregister(userId, request.endpoint());
    }
}
