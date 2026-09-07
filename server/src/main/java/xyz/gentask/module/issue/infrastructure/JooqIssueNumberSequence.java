package xyz.gentask.module.issue.infrastructure;

import static java.util.Objects.requireNonNull;
import static xyz.gentask.jooq.Tables.PROJECTS;

import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.issue.application.issue.IssueNumberSequence;

/** 기존 번호와 DB 호환성을 유지하기 위해 projects.next_number를 이슈 모듈에서 갱신한다. */
@Repository
@RequiredArgsConstructor
class JooqIssueNumberSequence implements IssueNumberSequence {
    private final DSLContext dslContext;

    @Override
    public int next(UUID projectId, Instant now) {
        return requireNonNull(dslContext
                                .update(PROJECTS)
                                .set(PROJECTS.NEXT_NUMBER, PROJECTS.NEXT_NUMBER.plus(1))
                                .set(PROJECTS.UPDATED_AT, now)
                                .where(PROJECTS.ID.eq(projectId))
                                .returningResult(PROJECTS.NEXT_NUMBER)
                                .fetchOne())
                        .value1()
                - 1;
    }
}
