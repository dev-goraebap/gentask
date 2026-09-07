package xyz.gentask.module.project.infrastructure;

import static org.jooq.impl.DSL.count;
import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.select;
import static xyz.gentask.jooq.Tables.PROJECTS;
import static xyz.gentask.jooq.Tables.TASKS;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.project.application.project.ProjectQuery;
import xyz.gentask.module.project.application.project.ProjectViews.ProjectView;

@Repository
@RequiredArgsConstructor
class JooqProjectQuery implements ProjectQuery {

    /**
     * 프로젝트 작업 수를 집계한다.
     */
    private static final Field<Integer> TASK_COUNT =
            field(select(count()).from(TASKS).where(TASKS.PROJECT_ID.eq(PROJECTS.ID)));

    private final DSLContext dslContext;

    @Override
    public List<ProjectView> findAll(UUID ownerId) {
        return fetch(accessible(ownerId), ownerId);
    }

    @Override
    public Optional<ProjectView> findOne(UUID ownerId, String id) {
        return fetch(accessible(ownerId).and(PROJECTS.ID.eq(id)), ownerId).stream()
                .findFirst();
    }

    private Condition accessible(UUID userId) {
        var members = xyz.gentask.jooq.Tables.PROJECT_MEMBERS;
        return PROJECTS.OWNER_ID
                .eq(userId)
                .or(org.jooq.impl.DSL.exists(select(members.USER_ID)
                        .from(members)
                        .where(members.PROJECT_ID.eq(PROJECTS.ID).and(members.USER_ID.eq(userId)))));
    }

    private List<ProjectView> fetch(Condition condition, UUID userId) {
        var members = xyz.gentask.jooq.Tables.PROJECT_MEMBERS;
        Field<String> role = org.jooq
                .impl
                .DSL
                .when(PROJECTS.OWNER_ID.eq(userId), "owner")
                .otherwise(select(members.ROLE)
                        .from(members)
                        .where(members.PROJECT_ID.eq(PROJECTS.ID).and(members.USER_ID.eq(userId)))
                        .asField());
        return dslContext
                .select(PROJECTS.ID, PROJECTS.NAME, PROJECTS.KEY, TASK_COUNT, role)
                .from(PROJECTS)
                .where(condition)
                .orderBy(PROJECTS.CREATED_AT.asc())
                .fetch(JooqProjectQuery::toView);
    }

    private static ProjectView toView(org.jooq.Record5<String, String, String, Integer, String> projectRecord) {
        return new ProjectView(
                projectRecord.value1(),
                projectRecord.value2(),
                projectRecord.value3(),
                projectRecord.value4(),
                projectRecord.value5());
    }
}
