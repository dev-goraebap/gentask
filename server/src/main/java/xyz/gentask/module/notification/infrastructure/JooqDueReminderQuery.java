package xyz.gentask.module.notification.infrastructure;

import static xyz.gentask.jooq.Tables.SENT_REMINDERS;
import static xyz.gentask.jooq.Tables.TASKS;

import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.notification.domain.reminder.DueReminder;
import xyz.gentask.module.notification.domain.reminder.DueReminderQuery;

/**
 * 발송 시점이 도래한 미완료 작업의 미리 알림을 조회한다. 이미 발송 완료된 알림은 제외한다.
 */
@Repository
@RequiredArgsConstructor
class JooqDueReminderQuery implements DueReminderQuery {

    private final DSLContext dslContext;

    @Override
    public List<DueReminder> findDue(LocalDateTime until, int limit) {
        return dslContext
                .select(TASKS.ID, TASKS.USER_ID, TASKS.TITLE, TASKS.REMIND_AT)
                .from(TASKS)
                .leftJoin(SENT_REMINDERS)
                .on(SENT_REMINDERS.TASK_ID.eq(TASKS.ID))
                .where(TASKS.REMIND_AT.isNotNull())
                .and(TASKS.REMIND_AT.le(until))
                .and(TASKS.COMPLETED_AT.isNull())
                .and(SENT_REMINDERS.TASK_ID.isNull().or(SENT_REMINDERS.REMIND_AT.ne(TASKS.REMIND_AT)))
                .orderBy(TASKS.REMIND_AT.asc())
                .limit(limit)
                .fetch(record -> new DueReminder(
                        record.get(TASKS.ID),
                        record.get(TASKS.USER_ID),
                        record.get(TASKS.TITLE),
                        record.get(TASKS.REMIND_AT)));
    }
}
