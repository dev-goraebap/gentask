package dev.goraebap.refarch.module.task.application.task;

import dev.goraebap.refarch.module.task.application.task.TaskViews.TaskView;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskQuery {

    List<TaskView> findAll(UUID userId);

    Optional<TaskView> findOne(UUID taskId, UUID userId);
}
