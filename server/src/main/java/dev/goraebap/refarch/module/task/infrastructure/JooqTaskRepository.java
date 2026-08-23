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

/**
 * 작업 저장소 구현.
 *
 * <p><b>jOOQ 에는 변경 감지가 없다.</b> 애그리거트를 고친 뒤에는 항상 {@code save} 를 부른다.
 *
 * <p>변환은 이 클래스의 비공개 메서드가 담당한다. 매퍼 클래스를 따로 두면 파일이 늘고 그 자체가
 * 유지 대상이 되는데, 저장소는 어차피 레코드를 다루므로 변환의 자연스러운 자리다.
 */
@Repository
@RequiredArgsConstructor
class JooqTaskRepository implements TaskRepository {

    private final DSLContext dsl;

    @Override
    public void save(Task task) {
        dsl.insertInto(TASKS)
                .set(TASKS.ID, task.id())
                .set(TASKS.TITLE, task.title().value())
                .set(TASKS.NOTE, task.note().value())
                .set(TASKS.DUE_DATE, task.dueDate())
                .set(TASKS.REMIND_AT, task.remindAt())
                .set(TASKS.IMPORTANT, task.important())
                .set(TASKS.MY_DAY_ON, task.myDayOn())
                .set(TASKS.COMPLETED_AT, offset(task.completedAt()))
                .set(TASKS.CREATED_AT, offset(task.createdAt()))
                .set(TASKS.UPDATED_AT, offset(task.updatedAt()))
                .onConflict(TASKS.ID)
                .doUpdate()
                .set(TASKS.TITLE, task.title().value())
                .set(TASKS.NOTE, task.note().value())
                .set(TASKS.DUE_DATE, task.dueDate())
                .set(TASKS.REMIND_AT, task.remindAt())
                .set(TASKS.IMPORTANT, task.important())
                .set(TASKS.MY_DAY_ON, task.myDayOn())
                .set(TASKS.COMPLETED_AT, offset(task.completedAt()))
                .set(TASKS.UPDATED_AT, offset(task.updatedAt()))
                .execute();
    }

    @Override
    public Optional<Task> findById(UUID id) {
        return dsl.selectFrom(TASKS).where(TASKS.ID.eq(id)).fetchOptional().map(JooqTaskRepository::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        dsl.deleteFrom(TASKS).where(TASKS.ID.eq(id)).execute();
    }

    private static Task toDomain(TasksRecord record) {
        return Task.restore(
                record.getId(),
                new TaskTitle(record.getTitle()),
                new TaskNote(record.getNote()),
                record.getDueDate(),
                record.getRemindAt(),
                Boolean.TRUE.equals(record.getImportant()),
                record.getMyDayOn(),
                instant(record.getCompletedAt()),
                instant(record.getCreatedAt()),
                instant(record.getUpdatedAt()));
    }

    private static OffsetDateTime offset(Instant instant) {
        return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
    }

    private static Instant instant(OffsetDateTime value) {
        return value == null ? null : value.toInstant();
    }
}
