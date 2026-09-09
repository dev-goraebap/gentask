package xyz.gentask.module.task.application.task;

import java.util.List;
import java.util.UUID;

public interface TaskNoteLinkStore {
    List<String> list(UUID taskId);

    void add(UUID taskId, String noteId);

    void remove(UUID taskId, String noteId);
}
