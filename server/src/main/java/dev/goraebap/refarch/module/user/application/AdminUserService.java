package dev.goraebap.refarch.module.user.application;

import dev.goraebap.refarch.module.user.application.AdminViews.AdminUserPageView;
import dev.goraebap.refarch.module.user.application.AdminViews.AdminUserView;
import dev.goraebap.refarch.module.user.domain.user.Role;
import dev.goraebap.refarch.module.user.domain.user.User;
import dev.goraebap.refarch.module.user.domain.user.UserRepository;
import dev.goraebap.refarch.module.user.domain.user.UserSummary;
import dev.goraebap.refarch.module.user.domain.user.UserSummaryQuery;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 관리자가 플랫폼의 사용자를 보고 권한을 바꾼다. TG-008.01. */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    /** 한 쪽의 최대 크기. 관리 화면이 한 번에 내려받는 양을 죈다. */
    static final int MAX_PAGE_SIZE = 100;

    private final UserSummaryQuery userSummaryQuery;
    private final UserRepository userRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public AdminUserPageView list(String keyword, int page, int size) {
        int limitedSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);

        List<UserSummary> found = userSummaryQuery.search(keyword, limitedSize, safePage * limitedSize);
        List<AdminUserView> items = found.stream().map(AdminUserService::toView).toList();
        return new AdminUserPageView(items, userSummaryQuery.count(keyword), safePage, limitedSize);
    }

    /**
     * 어떤 사용자의 역할을 바꾼다.
     *
     * <p>자기 자신은 바꾸지 못한다. 마지막 관리자가 스스로를 내리면 관리 화면에 들어갈 사람이 아무도
     * 없게 되고, 그 상태는 화면으로 되돌릴 수단이 없다.
     */
    @Transactional
    public void changeRole(UUID actorId, UUID targetId, String role) {
        if (actorId.equals(targetId)) {
            throw UserErrorCode.CANNOT_CHANGE_OWN_ROLE.raise();
        }
        User target = userRepository.findById(targetId).orElseThrow(UserErrorCode.USER_NOT_FOUND::raise);
        target.changeRole(parse(role), clock.instant());
        userRepository.save(target);
    }

    private static Role parse(String role) {
        try {
            return Role.valueOf(role);
        } catch (IllegalArgumentException exception) {
            throw UserErrorCode.INVALID_ROLE.raise();
        }
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
