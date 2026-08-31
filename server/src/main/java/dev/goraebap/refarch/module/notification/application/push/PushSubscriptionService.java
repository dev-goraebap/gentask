package dev.goraebap.refarch.module.notification.application.push;

import dev.goraebap.refarch.module.notification.application.NotificationErrorCode;
import dev.goraebap.refarch.module.notification.application.VapidProperties;
import dev.goraebap.refarch.module.notification.domain.subscription.PushSubscription;
import dev.goraebap.refarch.module.notification.domain.subscription.PushSubscriptionRepository;
import java.time.Clock;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PushSubscriptionService {

    /**
     * 한 사람이 등록할 수 있는 기기 수. 브라우저 데이터를 지우면 새 자리가 생기고 옛 자리는 죽은 채
     * 남으므로, 상한이 없으면 목록이 계속 자란다. 죽은 자리는 보낼 때 걷힌다.
     */
    static final int MAX_DEVICES = 20;

    private final PushSubscriptionRepository subscriptionRepository;
    private final VapidProperties vapid;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------

    /**
     * 브라우저가 구독할 때 필요한 공개 키를 낸다. 개인 키는 여기서 나가지 않는다.
     */
    @Transactional(readOnly = true)
    public String publicKey() {
        if (!vapid.isConfigured()) {
            throw NotificationErrorCode.PUSH_NOT_CONFIGURED.raise();
        }
        return vapid.publicKey();
    }

    /** 이 기기가 등록되어 있는지. 화면이 켜짐·꺼짐을 그리는 근거다. */
    @Transactional(readOnly = true)
    public boolean isRegistered(UUID userId, String endpoint) {
        return subscriptionRepository
                .findByEndpoint(endpoint)
                .filter(found -> found.userId().equals(userId))
                .isPresent();
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------

    /**
     * 이 기기를 받을 자리로 등록한다.
     *
     * <p>같은 endpoint 가 이미 있으면 새로 만들지 않는다. 브라우저가 같은 구독을 다시 보내는 것은 흔한
     * 일이며, 그때마다 행이 늘면 한 기기에 알림이 여러 번 간다.
     */
    @Transactional
    public void register(UUID userId, String endpoint, String p256dh, String auth) {
        if (!vapid.isConfigured()) {
            throw NotificationErrorCode.PUSH_NOT_CONFIGURED.raise();
        }
        if (subscriptionRepository.findByEndpoint(endpoint).isPresent()) {
            // 남의 자리였더라도 endpoint 는 그 브라우저의 것이다. 주인을 바꿔 다시 세운다
            subscriptionRepository.deleteByEndpoint(endpoint);
        } else if (subscriptionRepository.countByUserId(userId) >= MAX_DEVICES) {
            throw NotificationErrorCode.PUSH_SUBSCRIPTION_LIMIT_EXCEEDED.raise();
        }
        subscriptionRepository.save(
                PushSubscription.register(UUID.randomUUID(), userId, endpoint, p256dh, auth, clock.instant()));
    }

    /** 이 기기의 받을 자리를 거둔다. 브라우저 권한은 그대로 두므로 다시 켤 때 묻지 않는다. */
    @Transactional
    public void unregister(UUID userId, String endpoint) {
        subscriptionRepository
                .findByEndpoint(endpoint)
                .filter(found -> found.userId().equals(userId))
                .ifPresent(found -> subscriptionRepository.deleteById(found.id()));
    }
}
