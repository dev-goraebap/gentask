package xyz.gentask.module.task.infrastructure;

import static xyz.gentask.jooq.Tables.ARTIFACTS;
import static xyz.gentask.jooq.Tables.TASK_ARTIFACTS;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.task.application.task.TaskLinkStore;

@Repository
@RequiredArgsConstructor
class JooqTaskLinkStore implements TaskLinkStore {
    private final DSLContext dsl;

    @Override
    public List<LinkedArtifact> list(UUID taskId) {
        return dsl.select(ARTIFACTS.ID, ARTIFACTS.TITLE)
                .from(TASK_ARTIFACTS)
                .join(ARTIFACTS)
                .on(ARTIFACTS.ID.eq(TASK_ARTIFACTS.ARTIFACT_ID))
                .where(TASK_ARTIFACTS.TASK_ID.eq(taskId))
                .and(ARTIFACTS.DELETED_AT.isNull())
                .orderBy(ARTIFACTS.TITLE.asc(), ARTIFACTS.ID.asc())
                .fetch(r -> new LinkedArtifact(r.value1(), r.value2()));
    }

    @Override
    public void add(UUID taskId, String artifactId) {
        dsl.insertInto(TASK_ARTIFACTS)
                .set(TASK_ARTIFACTS.TASK_ID, taskId)
                .set(TASK_ARTIFACTS.ARTIFACT_ID, artifactId)
                .onConflictDoNothing()
                .execute();
    }

    @Override
    public void remove(UUID taskId, String artifactId) {
        dsl.deleteFrom(TASK_ARTIFACTS)
                .where(TASK_ARTIFACTS.TASK_ID.eq(taskId).and(TASK_ARTIFACTS.ARTIFACT_ID.eq(artifactId)))
                .execute();
    }
}
