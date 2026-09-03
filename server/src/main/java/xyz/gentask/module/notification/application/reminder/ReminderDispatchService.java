package xyz.gentask.module.notification.application.reminder;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.notification.application.VapidProperties;
import xyz.gentask.module.notification.domain.failure.PushDeliveryFailure;
import xyz.gentask.module.notification.domain.failure.PushDeliveryFailureRepository;
import xyz.gentask.module.notification.domain.reminder.DueReminder;
import xyz.gentask.module.notification.domain.reminder.DueReminderQuery;
import xyz.gentask.module.notification.domain.reminder.SentReminderRepository;
import xyz.gentask.module.notification.domain.subscription.PushSubscription;
import xyz.gentask.module.notification.domain.subscription.PushSubscriptionRepository;

/**
 * 지정 시각이 도래한 작업 미리 알림을 등록된 기기로 발송하는 서비스다(GT-34).
 */
@Service
@RequiredArgsConstructor
public class ReminderDispatchService {

    private static final Logger LOG = LoggerFactory.getLogger(ReminderDispatchService.class);

    /** 1회 배치 처리 시 조회할 최대 알림 건수(100건)다. */
    static final int BATCH_SIZE = 100;

    private final DueReminderQuery dueReminderQuery;
    private final SentReminderRepository sentReminderRepository;
    private final PushSubscriptionRepository subscriptionRepository;
    private final PushSender pushSender;
    private final PushDeliveryFailureRepository failureRepository;
    private final VapidProperties vapid;
    private final Clock clock;

    /**
     * 알림 발송 배치를 1회 실행한다. 외부 푸시 전송 지연으로 인한 커넥션 점유를 방지하기 위해 비트랜잭션으로 동작한다.
     *
     * @return 발송된 미리 알림 건수
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public int dispatchDue() {
        if (!vapid.isConfigured()) {
            return 0;
        }
        // remindAt은 시간대 정보가 없는 LocalDateTime이므로 시스템 기본 시간대(Asia/Seoul)를 기준으로 변환한다.
        LocalDateTime now = LocalDateTime.ofInstant(clock.instant(), clock.getZone());
        List<DueReminder> due = dueReminderQuery.findDue(now, BATCH_SIZE);

        int sent = 0;
        for (DueReminder reminder : due) {
            if (dispatch(reminder)) {
                sent++;
            }
        }
        if (sent > 0) {
            LOG.info("미리 알림을 보냈다. 건수={}", sent);
        }
        return sent;
    }

    /**
     * 단일 미리 알림을 해당 사용자의 등록된 모든 기기로 발송한다. 구독 기기가 없더라도 재발송 방지를 위해 발송 완료로 기록한다.
     */
    private boolean dispatch(DueReminder reminder) {
        List<PushSubscription> subscriptions = subscriptionRepository.findByUserId(reminder.userId());
        String payload = payloadOf(reminder);
        Instant now = Instant.now(clock);

        boolean anySent = false;
        for (PushSubscription subscription : subscriptions) {
            PushSender.Outcome outcome = pushSender.send(subscription, payload);
            if (outcome.isSent()) {
                anySent = true;
                continue;
            }
            // 발송 실패 이력을 저장하여 관리자 모니터링을 지원한다(GT-37).
            record(subscription, reminder, outcome, now);
            if (outcome.result() == PushSender.Result.GONE) {
                // 만료된 구독 엔드포인트(GONE)는 저장소에서 즉시 삭제한다(NTF-001 A4).
                subscriptionRepository.deleteById(subscription.id());
            }
        }
        sentReminderRepository.markSent(reminder.taskId(), reminder.remindAt(), now);
        return anySent;
    }

    private void record(PushSubscription subscription, DueReminder reminder, PushSender.Outcome outcome, Instant now) {
        PushDeliveryFailure.Reason reason = outcome.result() == PushSender.Result.GONE
                ? PushDeliveryFailure.Reason.GONE
                : PushDeliveryFailure.Reason.FAILED;
        failureRepository.save(PushDeliveryFailure.occur(
                UUID.randomUUID(),
                subscription.userId(),
                subscription.endpoint(),
                reminder.taskId(),
                reason,
                outcome.detail(),
                now));
    }

    /** 서비스 워커 푸시 페이로드 규격에 맞춰 JSON 문자열을 생성한다. */
    private static String payloadOf(DueReminder reminder) {
        return "{\"title\":\"" + escape(reminder.title()) + "\",\"body\":\"미리 알림\",\"tag\":\"task-" + reminder.taskId()
                + "\",\"url\":\"/\"}";
    }

    /** JSON 페이로드 이스케이프 유틸리티다. */
    private static String escape(String raw) {
        StringBuilder out = new StringBuilder(raw.length() + 8);
        for (char letter : raw.toCharArray()) {
            switch (letter) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (letter < 0x20) {
                        out.append(String.format("\\u%04x", (int) letter));
                    } else {
                        out.append(letter);
                    }
                }
            }
        }
        return out.toString();
    }
}
