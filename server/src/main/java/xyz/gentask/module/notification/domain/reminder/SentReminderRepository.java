package xyz.gentask.module.notification.domain.reminder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public interface SentReminderRepository {

    /** 보냈다고 표시한다. 같은 작업이 이미 있으면 시각을 갱신한다. */
    void markSent(UUID taskId, LocalDateTime remindAt, Instant sentAt);
}
