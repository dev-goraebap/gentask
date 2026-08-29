package dev.goraebap.refarch.module.notification.infrastructure;

import static dev.goraebap.refarch.jooq.Tables.SENT_REMINDERS;
import static dev.goraebap.refarch.jooq.Tables.TASKS;

import dev.goraebap.refarch.module.notification.domain.reminder.DueReminder;
import dev.goraebap.refarch.module.notification.domain.reminder.DueReminderQuery;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

/**
 * 보낼 때가 된 미리 알림을 찾는다.
 *
 * <p>같은 것을 두 번 보내지 않기 위해 sent_reminders 와 견준다. 보낸 기록이 없거나, 있더라도 그때의
 * 시각과 지금 작업의 시각이 다르면 보낼 대상이다 — 사용자가 시각을 바꾸면 다시 알려야 한다.
 *
 * <p>완료한 작업은 제외한다. 끝낸 일을 알리지 않는다.
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
