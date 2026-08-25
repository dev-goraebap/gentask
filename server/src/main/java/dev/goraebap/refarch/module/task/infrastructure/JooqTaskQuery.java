package dev.goraebap.refarch.module.task.infrastructure;

import static dev.goraebap.refarch.jooq.Tables.TASKS;

import dev.goraebap.refarch.jooq.tables.records.TasksRecord;
import dev.goraebap.refarch.module.task.application.task.TaskQuery;
import dev.goraebap.refarch.module.task.application.task.TaskViews.TaskView;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class JooqTaskQuery implements TaskQuery {

    private final DSLContext dslContext;

    @Override
    public List<TaskView> findAll(UUID userId) {
        return dslContext
                .selectFrom(TASKS)
                .where(TASKS.USER_ID.eq(userId))
                .orderBy(TASKS.CREATED_AT.desc())
                .fetch(JooqTaskQuery::toView);
    }

    @Override
    public Optional<TaskView> findOne(UUID taskId, UUID userId) {
        return dslContext
                .selectFrom(TASKS)
                .where(TASKS.ID.eq(taskId))
                .and(TASKS.USER_ID.eq(userId))
                .fetchOptional()
                .map(JooqTaskQuery::toView);
    }

    private static TaskView toView(TasksRecord tasksRecord) {
        return new TaskView(
                tasksRecord.getId(),
                tasksRecord.getTitle(),
                tasksRecord.getNote(),
                tasksRecord.getDueDate(),
                tasksRecord.getRemindAt(),
                Boolean.TRUE.equals(tasksRecord.getImportant()),
                tasksRecord.getMyDayOn(),
                tasksRecord.getCompletedAt(),
                tasksRecord.getCreatedAt());
    }
}
