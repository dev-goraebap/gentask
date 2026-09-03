package xyz.gentask.module.notification.domain.reminder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public interface SentReminderRepository {

    /** 미리 알림 발송 기록을 저장하거나 갱신한다. */
    void markSent(UUID taskId, LocalDateTime remindAt, Instant sentAt);
}
