package dev.goraebap.refarch.module.notification.application;

import dev.goraebap.refarch.module.notification.domain.reminder.DueReminder;
import dev.goraebap.refarch.module.notification.domain.reminder.DueReminderQuery;
import dev.goraebap.refarch.module.notification.domain.reminder.SentReminderRepository;
import dev.goraebap.refarch.module.notification.domain.subscription.PushSubscription;
import dev.goraebap.refarch.module.notification.domain.subscription.PushSubscriptionRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 정한 시각이 지난 미리 알림을 켜 둔 기기로 보낸다.
 *
 * <p>사용자가 시작하는 흐름이 아니라 시각이 트리거다. 주 액터가 없으므로 서술서를 갖지 않고 Story
 * TG-007.02 가 인수 조건을 갖는다.
 */
@Service
@RequiredArgsConstructor
public class ReminderDispatchService {

    private static final Logger LOG = LoggerFactory.getLogger(ReminderDispatchService.class);

    /** 한 회차에 다룰 최대 개수. 밀린 것이 많아도 한 회차가 길어지지 않게 한다. */
    static final int BATCH_SIZE = 100;

    private final DueReminderQuery dueReminderQuery;
    private final SentReminderRepository sentReminderRepository;
    private final PushSubscriptionRepository subscriptionRepository;
    private final PushSender pushSender;
    private final VapidProperties vapid;
    private final Clock clock;

    /**
     * 한 회차를 돈다.
     *
     * <p>트랜잭션을 열지 않는다고 선언한다. 발송은 바깥 서비스를 부르는 일이라 시간이 걸리고, 그 사이
     * 트랜잭션을 열어 두면 연결이 묶인다. 각 쓰기는 자기 자리에서 auto-commit 으로 끝난다.
     *
     * @return 보낸 미리 알림의 수
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public int dispatchDue() {
        if (!vapid.isConfigured()) {
            return 0;
        }
        // 시간대 없는 값이라 서버의 시간대로 해석한다. Clock 이 Asia/Seoul 로 고정되어 있으며
        // 사용자마다 다른 시간대를 갖는 요구가 생기면 그때 사용자 값을 받는다.
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
     * 하나를 보낸다.
     *
     * <p>켜 둔 기기가 없어도 보냈다고 표시한다. 그러지 않으면 그 작업이 회차마다 다시 조회되어 시각이
     * 지난 채 목록에 남는다. 알림을 켜지 않은 사용자는 그 시각을 놓치는 것이 정상 동작이다.
     */
    private boolean dispatch(DueReminder reminder) {
        List<PushSubscription> subscriptions = subscriptionRepository.findByUserId(reminder.userId());
        String payload = payloadOf(reminder);

        boolean anySent = false;
        for (PushSubscription subscription : subscriptions) {
            PushSender.Result result = pushSender.send(subscription, payload);
            if (result == PushSender.Result.GONE) {
                // 브라우저 데이터를 지우거나 오래 쓰지 않으면 자리가 만료된다. NTF-001 의 A4 다
                subscriptionRepository.deleteById(subscription.id());
            } else if (result == PushSender.Result.SENT) {
                anySent = true;
            }
        }
        sentReminderRepository.markSent(reminder.taskId(), reminder.remindAt(), Instant.now(clock));
        return anySent;
    }

    /** 서비스 워커가 읽는 형식. 필드 이름이 `sw.js` 의 것과 맞아야 한다. */
    private static String payloadOf(DueReminder reminder) {
        return "{\"title\":\"" + escape(reminder.title()) + "\",\"body\":\"미리 알림\",\"tag\":\"task-" + reminder.taskId()
                + "\",\"url\":\"/\"}";
    }

    /** 제목은 사용자가 적은 문자열이라 따옴표와 역슬래시가 들어올 수 있다. */
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
