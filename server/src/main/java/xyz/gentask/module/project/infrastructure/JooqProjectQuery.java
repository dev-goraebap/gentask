package xyz.gentask.module.project.infrastructure;

import static org.jooq.impl.DSL.count;
import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.select;
import static xyz.gentask.jooq.Tables.ISSUES;
import static xyz.gentask.jooq.Tables.PROJECTS;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record4;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.project.application.project.ProjectQuery;
import xyz.gentask.module.project.application.project.ProjectViews.ProjectView;

@Repository
@RequiredArgsConstructor
class JooqProjectQuery implements ProjectQuery {

    /**
     * 기존 프로젝트 API의 issueCount 응답을 유지하는 조회 전용 집계다.
     */
    private static final Field<Integer> ISSUE_COUNT =
            field(select(count()).from(ISSUES).where(ISSUES.PROJECT_ID.eq(PROJECTS.ID)));

    private final DSLContext dslContext;

    @Override
    public List<ProjectView> findAll(UUID ownerId) {
        return fetch(PROJECTS.OWNER_ID.eq(ownerId));
    }

    @Override
    public Optional<ProjectView> findOne(UUID ownerId, String id) {
        return fetch(PROJECTS.OWNER_ID.eq(ownerId).and(PROJECTS.ID.eq(id))).stream()
                .findFirst();
    }

    private List<ProjectView> fetch(Condition condition) {
        return dslContext
                .select(PROJECTS.ID, PROJECTS.NAME, PROJECTS.KEY, ISSUE_COUNT)
                .from(PROJECTS)
                .where(condition)
                .orderBy(PROJECTS.CREATED_AT.asc())
                .fetch(JooqProjectQuery::toView);
    }

    private static ProjectView toView(Record4<String, String, String, Integer> projectRecord) {
        return new ProjectView(
                projectRecord.value1(), projectRecord.value2(), projectRecord.value3(), projectRecord.value4());
    }
}
