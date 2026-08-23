package dev.goraebap.refarch.module.task.domain;

import java.util.Optional;
import java.util.UUID;

public interface TaskRepository {

    /** 삽입과 갱신을 하나로 다룬다. */
    void save(Task task);

    Optional<Task> findById(UUID taskId);

    void deleteById(UUID taskId);
}
