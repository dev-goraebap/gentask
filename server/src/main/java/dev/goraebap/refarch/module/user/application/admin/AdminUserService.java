package dev.goraebap.refarch.module.user.application.admin;

import dev.goraebap.refarch.module.user.application.admin.AdminViews.AdminUserPageView;
import dev.goraebap.refarch.module.user.application.admin.AdminViews.AdminUserView;
import dev.goraebap.refarch.module.user.domain.user.UserSummary;
import dev.goraebap.refarch.module.user.domain.user.UserSummaryQuery;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 관리자가 플랫폼의 사용자를 본다. TG-008.01. */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    /** 한 쪽의 최대 크기. 관리 화면이 한 번에 내려받는 양을 죈다. */
    static final int MAX_PAGE_SIZE = 100;

    private final UserSummaryQuery userSummaryQuery;

    @Transactional(readOnly = true)
    public AdminUserPageView list(String keyword, int page, int size) {
        int limitedSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);

        List<UserSummary> found = userSummaryQuery.search(keyword, limitedSize, safePage * limitedSize);
        List<AdminUserView> items = found.stream().map(AdminUserService::toView).toList();
        return new AdminUserPageView(items, userSummaryQuery.count(keyword), safePage, limitedSize);
    }

    private static AdminUserView toView(UserSummary summary) {
        return new AdminUserView(
                summary.id(),
                summary.email(),
                summary.nickname(),
                summary.role().name(),
                summary.createdAt());
    }
}
