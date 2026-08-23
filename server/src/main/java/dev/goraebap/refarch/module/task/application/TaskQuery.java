package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.module.task.application.TaskViews.TaskView;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskQuery {

    /** 만든 순서의 역순. */
    List<TaskView> findAll();

    Optional<TaskView> findOne(UUID taskId);
}
