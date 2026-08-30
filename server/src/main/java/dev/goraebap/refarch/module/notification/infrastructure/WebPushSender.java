package dev.goraebap.refarch.module.notification.infrastructure;

import dev.goraebap.refarch.module.notification.application.PushSender;
import dev.goraebap.refarch.module.notification.application.VapidProperties;
import dev.goraebap.refarch.module.notification.domain.subscription.PushSubscription;
import java.nio.charset.StandardCharsets;
import java.security.Security;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.util.EntityUtils;
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

    /** 기록 칸의 크기. 넘치면 저장이 실패하고 그것이 발송 실패를 가린다. */
    private static final int MAX_DETAIL = 500;

    private final VapidProperties vapid;

    WebPushSender(VapidProperties vapid) {
        this.vapid = vapid;
        Security.addProvider(new BouncyCastleProvider());
    }

    @Override
    public Outcome send(PushSubscription subscription, String payload) {
        try {
            PushService pushService = new PushService(vapid.publicKey(), vapid.privateKey(), vapid.subject());
            Notification notification =
                    new Notification(subscription.endpoint(), subscription.p256dh(), subscription.auth(), payload);

            HttpResponse response = pushService.send(notification);
            int status = response.getStatusLine().getStatusCode();
            if (status >= 200 && status < 300) {
                return Outcome.sent();
            }

            // 본문에 사유가 담겨 온다. 상태 코드만 남기면 "왜 거절했는가"에 답할 수 없다
            String reason = describe(status, response);
            if (status == NOT_FOUND || status == GONE) {
                return Outcome.gone(reason);
            }
            LOG.warn("푸시 발송이 거절되었다. {}", reason);
            return Outcome.failed(reason);
        } catch (Exception exception) {
            // 한 자리의 실패가 나머지 발송을 멈추면 안 된다. 다음 회차가 다시 시도한다
            LOG.warn("푸시 발송에 실패했다", exception);
            return Outcome.failed(describe(exception));
        }
    }

    private static String describe(int status, HttpResponse response) {
        String body = readBody(response);
        return trim("푸시 서비스가 " + status + " 로 답했다" + (body.isEmpty() ? "" : ": " + body));
    }

    /**
     * 응답 본문을 읽는다.
     *
     * <p>읽지 못해도 발송 결과의 판정은 바뀌지 않는다. 사유가 비는 것과 발송이 실패한 것은 다른 일이며,
     * 여기서 터지면 앞의 것이 뒤의 것을 가린다.
     */
    private static String readBody(HttpResponse response) {
        HttpEntity entity = response.getEntity();
        if (entity == null) {
            return "";
        }
        try {
            return EntityUtils.toString(entity, StandardCharsets.UTF_8).strip();
        } catch (Exception exception) {
            LOG.warn("푸시 서비스의 응답 본문을 읽지 못했다", exception);
            return "";
        }
    }

    private static String describe(Exception exception) {
        return trim(exception.getClass().getSimpleName()
                + (exception.getMessage() == null ? "" : ": " + exception.getMessage()));
    }

    private static String trim(String message) {
        return message.length() <= MAX_DETAIL ? message : message.substring(0, MAX_DETAIL);
    }
}
