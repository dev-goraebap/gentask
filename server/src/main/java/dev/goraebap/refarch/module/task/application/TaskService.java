package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.module.task.application.TaskViews.TaskView;
import dev.goraebap.refarch.module.task.domain.Task;
import dev.goraebap.refarch.module.task.domain.TaskRepository;
import dev.goraebap.refarch.module.task.domain.TaskTitle;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** TK-001 · TK-002. */
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskQuery taskQuery;
    private final Clock clock;

    /** TK-001 기본 흐름. */
    @Transactional
    public UUID add(String title) {
        Task task = Task.create(UUID.randomUUID(), TaskTitle.of(title), clock.instant());
        taskRepository.save(task);
        return task.id();
    }

    @Transactional(readOnly = true)
    public List<TaskView> list() {
        return taskQuery.findAll();
    }

    @Transactional(readOnly = true)
    public TaskView detail(UUID taskId) {
        return taskQuery.findOne(taskId).orElseThrow(TaskErrorCode.TASK_NOT_FOUND::raise);
    }
}
