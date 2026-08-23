package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.module.task.application.TaskViews.TaskView;
import dev.goraebap.refarch.module.task.domain.Task;
import dev.goraebap.refarch.module.task.domain.TaskRepository;
import dev.goraebap.refarch.module.task.domain.TaskTitle;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
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

    /**
     * TK-001 기본 흐름과 A2.
     *
     * 기한을 붙이는 것은 목록에 넣기 전이므로 저장은 한 번이다. 같은 시각을 넘겨 만든 시각과
     * 고친 시각이 갈리지 않게 한다.
     */
    @Transactional
    public UUID add(String title, LocalDate dueDate) {
        Instant now = clock.instant();
        Task task = Task.create(UUID.randomUUID(), TaskTitle.of(title), now);
        task.changeDueDate(dueDate, now);
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
