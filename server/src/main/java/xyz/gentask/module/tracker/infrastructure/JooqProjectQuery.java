package xyz.gentask.module.tracker.infrastructure;

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
import xyz.gentask.module.tracker.application.project.ProjectQuery;
import xyz.gentask.module.tracker.application.project.ProjectViews.ProjectView;

@Repository
@RequiredArgsConstructor
class JooqProjectQuery implements ProjectQuery {

    /**
     * 프로젝트별 작업 항목 수를 실시간으로 집계한다.
     */
    private static final Field<Integer> ISSUE_COUNT =
            field(select(count()).from(ISSUES).where(ISSUES.PROJECT_ID.eq(PROJECTS.ID)));

    private final DSLContext dslContext;

    @Override
    public List<ProjectView> findAll(UUID ownerId) {
        return fetch(PROJECTS.OWNER_ID.eq(ownerId));
    }

    @Override
    public Optional<ProjectView> findOne(UUID ownerId, String publicId) {
        return fetch(PROJECTS.OWNER_ID.eq(ownerId).and(PROJECTS.PUBLIC_ID.eq(publicId))).stream()
                .findFirst();
    }

    private List<ProjectView> fetch(Condition condition) {
        return dslContext
                // 클라이언트에 노출하는 식별자는 URL용 공개 식별자(publicId)다.
                .select(PROJECTS.PUBLIC_ID, PROJECTS.NAME, PROJECTS.KEY, ISSUE_COUNT)
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
