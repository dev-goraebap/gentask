package dev.goraebap.refarch.module.task.domain.file;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskFileRepository {

    void save(TaskFile taskFile);

    List<TaskFile> findByTaskId(UUID taskId);

    Optional<TaskFile> findById(UUID taskFileId);

    int countByTaskId(UUID taskId);

    void deleteById(UUID taskFileId);
}
