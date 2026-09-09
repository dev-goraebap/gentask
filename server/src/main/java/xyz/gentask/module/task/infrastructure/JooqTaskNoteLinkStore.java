package xyz.gentask.module.task.infrastructure;

import static xyz.gentask.jooq.Tables.TASK_NOTES;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.task.application.task.TaskNoteLinkStore;

@Repository
@RequiredArgsConstructor
class JooqTaskNoteLinkStore implements TaskNoteLinkStore {
    private final DSLContext dsl;

    public List<String> list(UUID taskId) {
        return dsl.select(TASK_NOTES.NOTE_ID)
                .from(TASK_NOTES)
                .where(TASK_NOTES.TASK_ID.eq(taskId))
                .fetch(TASK_NOTES.NOTE_ID);
    }

    public void add(UUID taskId, String noteId) {
        dsl.insertInto(TASK_NOTES)
                .set(TASK_NOTES.TASK_ID, taskId)
                .set(TASK_NOTES.NOTE_ID, noteId)
                .onConflictDoNothing()
                .execute();
    }

    public void remove(UUID taskId, String noteId) {
        dsl.deleteFrom(TASK_NOTES)
                .where(TASK_NOTES.TASK_ID.eq(taskId))
                .and(TASK_NOTES.NOTE_ID.eq(noteId))
                .execute();
    }
}
