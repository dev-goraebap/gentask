package xyz.gentask.module.task.infrastructure;

import static xyz.gentask.jooq.Tables.PROJECTS;
import static xyz.gentask.jooq.Tables.PROJECT_MEMBERS;
import static xyz.gentask.jooq.Tables.TASKS;
import static xyz.gentask.jooq.Tables.USERS;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.task.application.task.TaskQuery;
import xyz.gentask.module.task.application.task.TaskViews.TaskView;

@Repository
@RequiredArgsConstructor
class JooqTaskQuery implements TaskQuery {
    private final DSLContext dsl;

    private Condition accessible(UUID userId) {
        return TASKS.PROJECT_ID
                .isNull()
                .and(TASKS.USER_ID.eq(userId))
                .or(PROJECTS.OWNER_ID.eq(userId))
                .or(DSL.exists(DSL.selectOne()
                        .from(PROJECT_MEMBERS)
                        .where(PROJECT_MEMBERS
                                .PROJECT_ID
                                .eq(TASKS.PROJECT_ID)
                                .and(PROJECT_MEMBERS.USER_ID.eq(userId)))));
    }

    @Override
    public List<TaskView> findAll(UUID userId) {
        return fetch(accessible(userId)
                .and(TASKS.PROJECT_ID.isNull().and(TASKS.USER_ID.eq(userId)).or(TASKS.ASSIGNEE_ID.eq(userId))));
    }

    @Override
    public List<TaskView> findProject(String projectId) {
        return fetch(TASKS.PROJECT_ID.eq(projectId));
    }

    @Override
    public Optional<TaskView> findOne(UUID taskId, UUID userId) {
        return fetch(TASKS.ID.eq(taskId).and(accessible(userId))).stream().findFirst();
    }

    private List<TaskView> fetch(Condition condition) {
        return dsl.select(TASKS.fields())
                .select(PROJECTS.NAME, USERS.NICKNAME)
                .from(TASKS)
                .leftJoin(PROJECTS)
                .on(PROJECTS.ID.eq(TASKS.PROJECT_ID))
                .leftJoin(USERS)
                .on(USERS.ID.eq(TASKS.ASSIGNEE_ID))
                .where(condition)
                .orderBy(TASKS.CREATED_AT.desc(), TASKS.ID.asc())
                .fetch(r -> {
                    var t = r.into(TASKS);
                    return new TaskView(
                            t.getId(),
                            t.getTitle(),
                            t.getNote(),
                            t.getDueDate(),
                            t.getProjectId() == null ? t.getRemindAt() : null,
                            t.getProjectId() == null && Boolean.TRUE.equals(t.getImportant()),
                            t.getProjectId() == null ? t.getMyDayOn() : null,
                            t.getCompletedAt(),
                            t.getCreatedAt(),
                            t.getState(),
                            t.getProjectId(),
                            r.get(PROJECTS.NAME),
                            t.getAssigneeId(),
                            r.get(USERS.NICKNAME));
                });
    }
}
