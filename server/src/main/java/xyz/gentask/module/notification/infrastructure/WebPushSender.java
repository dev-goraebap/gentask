package xyz.gentask.module.notification.infrastructure;

import java.nio.charset.StandardCharsets;
import java.security.Security;
import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.util.EntityUtils;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import xyz.gentask.module.notification.application.VapidProperties;
import xyz.gentask.module.notification.application.reminder.PushSender;
import xyz.gentask.module.notification.domain.subscription.PushSubscription;

/**
 * VAPID 서명 및 페이로드 암호화를 수행하여 웹 푸시 알림을 전송하는 어댑터다.
 */
@Component
class WebPushSender implements PushSender {

    private static final Logger LOG = LoggerFactory.getLogger(WebPushSender.class);

    /** 푸시 서비스가 구독 만료 또는 소멸로 응답하는 HTTP 상태 코드 집합이다. */
    private static final int NOT_FOUND = 404;

    private static final int GONE = 410;

    /** 실패 사유 메시지의 최대 보관 길이(500자)다. */
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

            // RFC 8291 규격에 맞춰 aes128gcm 인코딩을 지정한다.
            HttpResponse response = pushService.send(notification, Encoding.AES128GCM);
            int status = response.getStatusLine().getStatusCode();
            if (status >= 200 && status < 300) {
                return Outcome.sent();
            }

            // 오류 분석을 위해 응답 본문의 상세 사유를 수집한다.
            String reason = describe(status, response);
            if (status == NOT_FOUND || status == GONE) {
                return Outcome.gone(reason);
            }
            LOG.warn("푸시 발송이 거절되었다. {}", reason);
            return Outcome.failed(reason);
        } catch (Exception exception) {
            // 개별 기기 발송 실패가 전체 스케줄러 배치를 중단시키지 않도록 예외를 흡수한다.
            LOG.warn("푸시 발송에 실패했다", exception);
            return Outcome.failed(describe(exception));
        }
    }

    private static String describe(int status, HttpResponse response) {
        String body = readBody(response);
        return trim("푸시 서비스가 " + status + " 로 답했다" + (body.isEmpty() ? "" : ": " + body));
    }

    /**
     * 오류 응답 본문 스트림을 읽어 문자열로 반환한다.
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
