package dev.goraebap.refarch.module.user.application.admin;

import dev.goraebap.refarch.module.user.application.admin.AdminViews.AdminUserPageView;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
}
