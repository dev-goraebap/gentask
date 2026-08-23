package dev.goraebap.refarch.module.task.infrastructure;

import static dev.goraebap.refarch.jooq.Tables.TASKS;

import dev.goraebap.refarch.jooq.tables.records.TasksRecord;
import dev.goraebap.refarch.module.task.application.TaskQuery;
import dev.goraebap.refarch.module.task.application.TaskViews.TaskView;
import java.time.Instant;
import java.time.OffsetDateTime;
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
    public List<TaskView> findAll() {
        return dslContext.selectFrom(TASKS).orderBy(TASKS.CREATED_AT.desc()).fetch(JooqTaskQuery::toView);
    }

    @Override
    public Optional<TaskView> findOne(UUID taskId) {
        return dslContext
                .selectFrom(TASKS)
                .where(TASKS.ID.eq(taskId))
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
                toInstant(tasksRecord.getCompletedAt()),
                toInstant(tasksRecord.getCreatedAt()));
    }

    private static Instant toInstant(OffsetDateTime offsetDateTime) {
        return offsetDateTime == null ? null : offsetDateTime.toInstant();
    }
}
