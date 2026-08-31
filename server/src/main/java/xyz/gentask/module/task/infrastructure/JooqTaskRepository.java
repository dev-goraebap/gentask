package xyz.gentask.module.task.infrastructure;

import static xyz.gentask.jooq.Tables.TASKS;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.TasksRecord;
import xyz.gentask.module.task.domain.task.Task;
import xyz.gentask.module.task.domain.task.TaskNote;
import xyz.gentask.module.task.domain.task.TaskRepository;
import xyz.gentask.module.task.domain.task.TaskTitle;

@Repository
@RequiredArgsConstructor
class JooqTaskRepository implements TaskRepository {

    private final DSLContext dslContext;

    @Override
    public void save(Task task) {
        dslContext
                .insertInto(TASKS)
                .set(TASKS.ID, task.id())
                .set(TASKS.USER_ID, task.userId())
                .set(TASKS.TITLE, task.title().value())
                .set(TASKS.NOTE, task.note().value())
                .set(TASKS.DUE_DATE, task.dueDate())
                .set(TASKS.REMIND_AT, task.remindAt())
                .set(TASKS.IMPORTANT, task.important())
                .set(TASKS.MY_DAY_ON, task.myDayOn())
                .set(TASKS.COMPLETED_AT, task.completedAt())
                .set(TASKS.CREATED_AT, task.createdAt())
                .set(TASKS.UPDATED_AT, task.updatedAt())
                .onConflict(TASKS.ID)
                .doUpdate()
                .set(TASKS.TITLE, task.title().value())
                .set(TASKS.NOTE, task.note().value())
                .set(TASKS.DUE_DATE, task.dueDate())
                .set(TASKS.REMIND_AT, task.remindAt())
                .set(TASKS.IMPORTANT, task.important())
                .set(TASKS.MY_DAY_ON, task.myDayOn())
                .set(TASKS.COMPLETED_AT, task.completedAt())
                .set(TASKS.UPDATED_AT, task.updatedAt())
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

    private static Task toDomain(TasksRecord tasksRecord) {
        return Task.restore(
                tasksRecord.getId(),
                tasksRecord.getUserId(),
                new TaskTitle(tasksRecord.getTitle()),
                new TaskNote(tasksRecord.getNote()),
                tasksRecord.getDueDate(),
                tasksRecord.getRemindAt(),
                Boolean.TRUE.equals(tasksRecord.getImportant()),
                tasksRecord.getMyDayOn(),
                tasksRecord.getCompletedAt(),
                tasksRecord.getCreatedAt(),
                tasksRecord.getUpdatedAt());
    }
}
