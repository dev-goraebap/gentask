package xyz.gentask.module.task.domain.task;

import java.util.Optional;
import java.util.UUID;

public interface TaskRepository {

    void save(Task task);

    Optional<Task> findById(UUID taskId);

    void deleteById(UUID taskId);
}
