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
     * 작업 아이템 수는 저장하지 않고 셀 때마다 센다.
     *
     * <p>저장해 두면 두 자리가 어긋났을 때 어느 쪽이 참인지 판정할 근거가 없다. 프로젝트 목록은 사람이
     * 가진 몇 개뿐이라 이 집계가 문제가 되는 자리가 아니다.
     */
    private static final Field<Integer> ISSUE_COUNT =
            field(select(count()).from(ISSUES).where(ISSUES.PROJECT_ID.eq(PROJECTS.ID)));

    private final DSLContext dslContext;

    @Override
    public List<ProjectView> findAll(UUID ownerId) {
        return fetch(PROJECTS.OWNER_ID.eq(ownerId));
    }

    @Override
    public Optional<ProjectView> findOne(UUID projectId, UUID ownerId) {
        return fetch(PROJECTS.ID.eq(projectId).and(PROJECTS.OWNER_ID.eq(ownerId))).stream()
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

    private static ProjectView toView(Record4<UUID, String, String, Integer> projectRecord) {
        return new ProjectView(
                projectRecord.value1(), projectRecord.value2(), projectRecord.value3(), projectRecord.value4());
    }
}
