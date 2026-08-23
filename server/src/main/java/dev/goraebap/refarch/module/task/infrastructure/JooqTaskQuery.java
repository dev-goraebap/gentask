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

/**
 * 조회 어댑터 — SQL 이 보이는 유일한 자리다.
 *
 * <p>애그리거트를 조립하지 않고 화면 구조를 바로 만든다. 도메인 저장소로 화면 데이터를 만들면
 * <b>화면 요구가 도메인 모델을 끌어당긴다</b> — 목록에 필요하다는 이유로 엔티티에 필드가 붙고,
 * 그 필드는 쓰기 로직에서 아무 의미를 갖지 않는다.
 */
@Repository
@RequiredArgsConstructor
class JooqTaskQuery implements TaskQuery {

    private final DSLContext dsl;

    @Override
    public List<TaskView> findAll() {
        // 정렬을 쿼리가 결정한다. 전부 가져와 코드가 줄 세우면 목록이 커질 때 그대로 무너진다.
        return dsl.selectFrom(TASKS).orderBy(TASKS.CREATED_AT.desc()).fetch(JooqTaskQuery::toView);
    }

    @Override
    public Optional<TaskView> findOne(UUID id) {
        return dsl.selectFrom(TASKS).where(TASKS.ID.eq(id)).fetchOptional().map(JooqTaskQuery::toView);
    }

    private static TaskView toView(TasksRecord record) {
        return new TaskView(
                record.getId(),
                record.getTitle(),
                record.getNote(),
                record.getDueDate(),
                record.getRemindAt(),
                Boolean.TRUE.equals(record.getImportant()),
                record.getMyDayOn(),
                instant(record.getCompletedAt()),
                instant(record.getCreatedAt()));
    }

    private static Instant instant(OffsetDateTime value) {
        return value == null ? null : value.toInstant();
    }
}
