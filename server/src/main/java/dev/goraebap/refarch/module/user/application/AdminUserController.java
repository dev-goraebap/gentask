package dev.goraebap.refarch.module.user.application;

import dev.goraebap.refarch.module.user.application.AdminRequests.ChangeRole;
import dev.goraebap.refarch.module.user.application.AdminViews.AdminUserPageView;
import dev.goraebap.refarch.shared.web.CurrentUser;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 관리자 전용. 이 경로의 접근 판정은 AdminInterceptor 가 갖는다. */
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public AdminUserPageView list(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminUserService.list(keyword, page, size);
    }

    @PatchMapping("/{userId}/role")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeRole(
            @CurrentUser UUID actorId, @PathVariable UUID userId, @Valid @RequestBody ChangeRole request) {
        adminUserService.changeRole(actorId, userId, request.role());
    }
}
