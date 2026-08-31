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
        // 같은 작업의 시각이 바뀌어 다시 보낸 경우 앞의 기록을 덮는다
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
