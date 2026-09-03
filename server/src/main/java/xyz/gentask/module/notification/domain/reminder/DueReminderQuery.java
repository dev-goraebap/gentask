package xyz.gentask.module.notification.domain.reminder;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 발송 시점이 도래한 미발송 작업 미리 알림 조회 포트다.
 */
public interface DueReminderQuery {

    /**
     * 지정 시점 이전의 미발송 알림을 지정 건수 한도 내에서 조회한다.
     */
    List<DueReminder> findDue(LocalDateTime until, int limit);
}
