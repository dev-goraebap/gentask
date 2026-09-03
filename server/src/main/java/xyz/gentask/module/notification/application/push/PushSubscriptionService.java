package xyz.gentask.module.notification.application.push;

import java.time.Clock;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.notification.application.NotificationErrorCode;
import xyz.gentask.module.notification.application.VapidProperties;
import xyz.gentask.module.notification.domain.subscription.PushSubscription;
import xyz.gentask.module.notification.domain.subscription.PushSubscriptionRepository;

@Service
@RequiredArgsConstructor
public class PushSubscriptionService {

    /**
     * 사용자당 등록 가능한 최대 기기 수(20개)다.
     */
    static final int MAX_DEVICES = 20;

    private final PushSubscriptionRepository subscriptionRepository;
    private final VapidProperties vapid;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------

    /**
     * 웹 푸시 구독에 필요한 VAPID 공개 키를 반환한다.
     */
    @Transactional(readOnly = true)
    public String publicKey() {
        if (!vapid.isConfigured()) {
            throw NotificationErrorCode.PUSH_NOT_CONFIGURED.raise();
        }
        return vapid.publicKey();
    }

    /** 특정 사용자의 기기 엔드포인트 등록 여부를 확인한다. */
    @Transactional(readOnly = true)
    public boolean isRegistered(UUID userId, String endpoint) {
        return subscriptionRepository
                .findByEndpoint(endpoint)
                .filter(found -> found.userId().equals(userId))
                .isPresent();
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------

    /**
     * 기기 엔드포인트를 웹 푸시 수신처로 등록한다. 동일 엔드포인트가 이미 존재하면 갱신한다.
     */
    @Transactional
    public void register(UUID userId, String endpoint, String p256dh, String auth) {
        if (!vapid.isConfigured()) {
            throw NotificationErrorCode.PUSH_NOT_CONFIGURED.raise();
        }
        if (subscriptionRepository.findByEndpoint(endpoint).isPresent()) {
            // 기존에 타 사용자로 등록된 엔드포인트인 경우 기존 구독을 삭제하고 현재 사용자로 재등록한다.
            subscriptionRepository.deleteByEndpoint(endpoint);
        } else if (subscriptionRepository.countByUserId(userId) >= MAX_DEVICES) {
            throw NotificationErrorCode.PUSH_SUBSCRIPTION_LIMIT_EXCEEDED.raise();
        }
        subscriptionRepository.save(
                PushSubscription.register(UUID.randomUUID(), userId, endpoint, p256dh, auth, clock.instant()));
    }

    /** 지정한 기기의 웹 푸시 구독을 해제한다. */
    @Transactional
    public void unregister(UUID userId, String endpoint) {
        subscriptionRepository
                .findByEndpoint(endpoint)
                .filter(found -> found.userId().equals(userId))
                .ifPresent(found -> subscriptionRepository.deleteById(found.id()));
    }
}
