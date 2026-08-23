package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.module.task.application.TaskRequests.CreateTask;
import dev.goraebap.refarch.module.task.application.TaskViews.TaskView;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** TK-001 · TK-002. */
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskView> add(@Valid @RequestBody CreateTask createTask) {
        UUID taskId = taskService.add(createTask.title(), createTask.dueDate());
        return ResponseEntity.created(URI.create("/api/v1/tasks/" + taskId)).body(taskService.detail(taskId));
    }

    @GetMapping
    public List<TaskView> list() {
        return taskService.list();
    }

    @GetMapping("/{taskId}")
    public TaskView detail(@PathVariable UUID taskId) {
        return taskService.detail(taskId);
    }
}
