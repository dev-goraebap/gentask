package dev.goraebap.refarch.module.task.infrastructure;

import static dev.goraebap.refarch.jooq.Tables.TASKS;

import dev.goraebap.refarch.jooq.tables.records.TasksRecord;
import dev.goraebap.refarch.module.task.domain.Task;
import dev.goraebap.refarch.module.task.domain.TaskNote;
import dev.goraebap.refarch.module.task.domain.TaskRepository;
import dev.goraebap.refarch.module.task.domain.TaskTitle;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

/** jOOQ 에는 변경 감지가 없다. 애그리거트를 고친 뒤에는 항상 save 를 불러야 한다. */
@Repository
@RequiredArgsConstructor
class JooqTaskRepository implements TaskRepository {

    private final DSLContext dslContext;

    @Override
    public void save(Task task) {
        dslContext
                .insertInto(TASKS)
                .set(TASKS.ID, task.id())
                .set(TASKS.TITLE, task.title().value())
                .set(TASKS.NOTE, task.note().value())
                .set(TASKS.DUE_DATE, task.dueDate())
                .set(TASKS.REMIND_AT, task.remindAt())
                .set(TASKS.IMPORTANT, task.important())
                .set(TASKS.MY_DAY_ON, task.myDayOn())
                .set(TASKS.COMPLETED_AT, toOffsetDateTime(task.completedAt()))
                .set(TASKS.CREATED_AT, toOffsetDateTime(task.createdAt()))
                .set(TASKS.UPDATED_AT, toOffsetDateTime(task.updatedAt()))
                .onConflict(TASKS.ID)
                .doUpdate()
                .set(TASKS.TITLE, task.title().value())
                .set(TASKS.NOTE, task.note().value())
                .set(TASKS.DUE_DATE, task.dueDate())
                .set(TASKS.REMIND_AT, task.remindAt())
                .set(TASKS.IMPORTANT, task.important())
                .set(TASKS.MY_DAY_ON, task.myDayOn())
                .set(TASKS.COMPLETED_AT, toOffsetDateTime(task.completedAt()))
                .set(TASKS.UPDATED_AT, toOffsetDateTime(task.updatedAt()))
                .execute();
    }

    @Override
    public Optional<Task> findById(UUID taskId) {
        return dslContext
                .selectFrom(TASKS)
                .where(TASKS.ID.eq(taskId))
                .fetchOptional()
                .map(JooqTaskRepository::toDomain);
    }

    @Override
    public void deleteById(UUID taskId) {
        dslContext.deleteFrom(TASKS).where(TASKS.ID.eq(taskId)).execute();
    }

    /** 정규 생성자로 값 객체를 만든다. 검증을 지나지 않는다. */
    private static Task toDomain(TasksRecord tasksRecord) {
        return Task.restore(
                tasksRecord.getId(),
                new TaskTitle(tasksRecord.getTitle()),
                new TaskNote(tasksRecord.getNote()),
                tasksRecord.getDueDate(),
                tasksRecord.getRemindAt(),
                Boolean.TRUE.equals(tasksRecord.getImportant()),
                tasksRecord.getMyDayOn(),
                toInstant(tasksRecord.getCompletedAt()),
                toInstant(tasksRecord.getCreatedAt()),
                toInstant(tasksRecord.getUpdatedAt()));
    }

    private static OffsetDateTime toOffsetDateTime(Instant instant) {
        return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
    }

    private static Instant toInstant(OffsetDateTime offsetDateTime) {
        return offsetDateTime == null ? null : offsetDateTime.toInstant();
    }
}
