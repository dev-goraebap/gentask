package dev.goraebap.refarch.module.notification.application.failure;

import dev.goraebap.refarch.module.notification.application.NotificationErrorCode;
import dev.goraebap.refarch.module.notification.application.failure.AdminPushViews.PushFailurePageView;
import dev.goraebap.refarch.module.notification.application.failure.AdminPushViews.PushFailureView;
import dev.goraebap.refarch.module.notification.domain.failure.PushDeliveryFailure;
import dev.goraebap.refarch.module.notification.domain.failure.PushDeliveryFailureRepository;
import dev.goraebap.refarch.module.notification.domain.failure.PushFailureQuery;
import dev.goraebap.refarch.module.notification.domain.subscription.PushSubscriptionRepository;
import dev.goraebap.refarch.module.user.UserBrief;
import dev.goraebap.refarch.module.user.Users;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 관리자가 알림이 닿지 않은 자리를 보고 정리한다. TG-008.02. */
@Service
@RequiredArgsConstructor
public class AdminPushService {

    /** 한 쪽의 최대 크기. 관리 화면이 한 번에 내려받는 양을 죈다. */
    static final int MAX_PAGE_SIZE = 100;

    private final PushFailureQuery pushFailureQuery;
    private final PushDeliveryFailureRepository failureRepository;
    private final PushSubscriptionRepository subscriptionRepository;
    private final Users users;
    private final Clock clock;

    @Transactional(readOnly = true)
    public PushFailurePageView list(boolean includeResolved, int page, int size) {
        int limitedSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);

        List<PushDeliveryFailure> found = pushFailureQuery.search(includeResolved, limitedSize, safePage * limitedSize);
        // 사용자를 이름으로 보여 주는 것은 user 모듈의 일이다. 줄마다 부르지 않도록 한 번에 옮긴다
        Map<UUID, UserBrief> briefs = users.findBriefs(
                found.stream().map(PushDeliveryFailure::userId).distinct().toList());

        List<PushFailureView> items = found.stream()
                .map(failure -> toView(failure, briefs.get(failure.userId())))
                .toList();
        return new PushFailurePageView(items, pushFailureQuery.count(includeResolved), safePage, limitedSize);
    }

    /** 확인했다고 표시한다. 자리는 그대로 두므로 다음 회차에 다시 시도한다. */
    @Transactional
    public void resolve(UUID failureId) {
        PushDeliveryFailure failure = find(failureId);
        failure.resolve(clock.instant());
        failureRepository.save(failure);
    }

    /**
     * 그 자리를 거둔다. 거둔 뒤에는 보낼 대상이 아니므로 같은 실패가 다시 쌓이지 않는다.
     *
     * <p>사용자가 다시 켜면 새 자리가 선다. 관리자가 거두는 것은 그 사용자의 알림을 끄는 것이 아니라
     * 죽은 자리를 목록에서 없애는 일이다.
     */
    @Transactional
    public void revoke(UUID failureId) {
        PushDeliveryFailure failure = find(failureId);
        subscriptionRepository.deleteByEndpoint(failure.endpoint());
        failure.resolve(clock.instant());
        failureRepository.save(failure);
    }

    private PushDeliveryFailure find(UUID failureId) {
        return failureRepository.findById(failureId).orElseThrow(NotificationErrorCode.PUSH_FAILURE_NOT_FOUND::raise);
    }

    private static PushFailureView toView(PushDeliveryFailure failure, UserBrief brief) {
        return new PushFailureView(
                failure.id(),
                failure.userId(),
                brief == null ? null : brief.email(),
                brief == null ? null : brief.nickname(),
                failure.endpoint(),
                failure.taskId(),
                failure.reason().name(),
                failure.detail(),
                failure.occurredAt(),
                failure.resolvedAt());
    }
}
