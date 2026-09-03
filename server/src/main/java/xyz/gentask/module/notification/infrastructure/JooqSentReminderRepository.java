package xyz.gentask.module.notification.infrastructure;

import static xyz.gentask.jooq.Tables.SENT_REMINDERS;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.notification.domain.reminder.SentReminderRepository;

@Repository
@RequiredArgsConstructor
class JooqSentReminderRepository implements SentReminderRepository {

    private final DSLContext dslContext;

    @Override
    public void markSent(UUID taskId, LocalDateTime remindAt, Instant sentAt) {
        // 알림 시각이 변경되어 재발송된 경우 기존 기록을 갱신한다.
        dslContext
                .insertInto(SENT_REMINDERS)
                .set(SENT_REMINDERS.TASK_ID, taskId)
                .set(SENT_REMINDERS.REMIND_AT, remindAt)
                .set(SENT_REMINDERS.SENT_AT, sentAt)
                .onConflict(SENT_REMINDERS.TASK_ID)
                .doUpdate()
                .set(SENT_REMINDERS.REMIND_AT, remindAt)
                .set(SENT_REMINDERS.SENT_AT, sentAt)
                .execute();
    }
}
