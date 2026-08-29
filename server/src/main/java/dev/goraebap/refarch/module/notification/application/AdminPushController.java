package dev.goraebap.refarch.module.notification.application;

import dev.goraebap.refarch.module.notification.application.AdminPushViews.PushFailurePageView;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 관리자 전용. 이 경로의 접근 판정은 AdminInterceptor 가 갖는다. */
@RestController
@RequestMapping("/api/v1/admin/push/failures")
@RequiredArgsConstructor
public class AdminPushController {

    private final AdminPushService adminPushService;

    @GetMapping
    public PushFailurePageView list(
            @RequestParam(defaultValue = "false") boolean includeResolved,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminPushService.list(includeResolved, page, size);
    }

    @PostMapping("/{failureId}/resolve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resolve(@PathVariable UUID failureId) {
        adminPushService.resolve(failureId);
    }

    @PostMapping("/{failureId}/revoke")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable UUID failureId) {
        adminPushService.revoke(failureId);
    }
}
