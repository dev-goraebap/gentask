package xyz.gentask.module.task.application.task;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import xyz.gentask.module.task.application.task.TaskViews.TaskView;

public interface TaskQuery {

    List<TaskView> findAll(UUID userId);

    Optional<TaskView> findOne(UUID taskId, UUID userId);
}
