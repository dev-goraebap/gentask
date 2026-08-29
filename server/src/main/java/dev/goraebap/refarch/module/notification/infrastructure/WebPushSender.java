package dev.goraebap.refarch.module.notification.infrastructure;

import dev.goraebap.refarch.module.notification.application.PushSender;
import dev.goraebap.refarch.module.notification.application.VapidProperties;
import dev.goraebap.refarch.module.notification.domain.subscription.PushSubscription;
import java.security.Security;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 웹 푸시로 내보낸다. VAPID 서명과 페이로드 암호화를 라이브러리가 맡는다.
 *
 * <p>BouncyCastle 을 JCE 공급자로 등록하는 것은 표준 JDK 가 이 조합의 타원곡선 연산을 갖지 않기
 * 때문이다. 라이브러리가 요구하는 절차다.
 */
@Component
class WebPushSender implements PushSender {

    private static final Logger LOG = LoggerFactory.getLogger(WebPushSender.class);

    /** 푸시 서비스가 자리가 사라졌다고 답하는 두 코드. 그 자리는 다시 살아나지 않는다. */
    private static final int NOT_FOUND = 404;

    private static final int GONE = 410;

    private final VapidProperties vapid;

    WebPushSender(VapidProperties vapid) {
        this.vapid = vapid;
        Security.addProvider(new BouncyCastleProvider());
    }

    @Override
    public Result send(PushSubscription subscription, String payload) {
        try {
            PushService pushService = new PushService(vapid.publicKey(), vapid.privateKey(), vapid.subject());
            Notification notification =
                    new Notification(subscription.endpoint(), subscription.p256dh(), subscription.auth(), payload);

            int status = pushService.send(notification).getStatusLine().getStatusCode();
            if (status == NOT_FOUND || status == GONE) {
                return Result.GONE;
            }
            if (status >= 200 && status < 300) {
                return Result.SENT;
            }
            LOG.warn("푸시 발송이 거절되었다. status={}", status);
            return Result.FAILED;
        } catch (Exception exception) {
            // 한 자리의 실패가 나머지 발송을 멈추면 안 된다. 다음 회차가 다시 시도한다
            LOG.warn("푸시 발송에 실패했다", exception);
            return Result.FAILED;
        }
    }
}
