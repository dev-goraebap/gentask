package xyz.gentask.module.task.application.task;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import xyz.gentask.module.task.application.task.TaskViews.TaskView;

public interface TaskQuery {
    default List<TaskView> findVisible(UUID userId, boolean personal) {
        return findVisible(userId, personal, TaskDateFilter.all());
    }

    List<TaskView> findVisible(UUID userId, boolean personal, TaskDateFilter filter);

    List<TaskView> findAll(UUID userId);

    default List<TaskView> findProject(String projectId) {
        return findProject(projectId, TaskDateFilter.all());
    }

    List<TaskView> findProject(String projectId, TaskDateFilter filter);

    Optional<TaskView> findOne(UUID taskId, UUID userId);
}
