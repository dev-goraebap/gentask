package xyz.gentask.module.user.application;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.user.UserBrief;
import xyz.gentask.module.user.Users;
import xyz.gentask.module.user.domain.user.UserSummary;
import xyz.gentask.module.user.domain.user.UserSummaryQuery;

/** {@link Users} 창구의 구현. 다른 모듈이 사용자를 이름으로 보여 줄 때 지난다. */
@Service
@RequiredArgsConstructor
public class UserDirectoryService implements Users {

    private final UserSummaryQuery userSummaryQuery;

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, UserBrief> findBriefs(Collection<UUID> userIds) {
        return userSummaryQuery.findAllByIds(userIds).stream()
                .collect(Collectors.toMap(UserSummary::id, UserDirectoryService::toBrief, (a, b) -> a));
    }

    private static UserBrief toBrief(UserSummary summary) {
        return new UserBrief(summary.id(), summary.email(), summary.nickname());
    }
}
