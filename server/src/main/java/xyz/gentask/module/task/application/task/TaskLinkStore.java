package xyz.gentask.module.task.application.task;

import java.util.List;
import java.util.UUID;

public interface TaskLinkStore {
    record LinkedArtifact(String id, String title) {}

    List<LinkedArtifact> list(UUID taskId);

    void add(UUID taskId, String artifactId);

    void remove(UUID taskId, String artifactId);
}
