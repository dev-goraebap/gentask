package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.module.task.application.TaskRequests.ChangeCompletion;
import dev.goraebap.refarch.module.task.application.TaskRequests.ChangeImportance;
import dev.goraebap.refarch.module.task.application.TaskRequests.ChangeMyDay;
import dev.goraebap.refarch.module.task.application.TaskRequests.CreateTask;
import dev.goraebap.refarch.module.task.application.TaskRequests.EditTask;
import dev.goraebap.refarch.module.task.application.TaskViews.TaskView;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** TK-001 ~ TK-004. */
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<Void> add(@Valid @RequestBody CreateTask createTask) {
        UUID taskId = taskService.add(createTask.title(), createTask.dueDate());
        return ResponseEntity.created(URI.create("/api/v1/tasks/" + taskId)).build();
    }

    @GetMapping
    public List<TaskView> list() {
        return taskService.list();
    }

    @GetMapping("/{taskId}")
    public TaskView detail(@PathVariable UUID taskId) {
        return taskService.detail(taskId);
    }

    @PatchMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(@PathVariable UUID taskId, @Valid @RequestBody EditTask editTask) {
        taskService.edit(taskId, editTask.title(), editTask.note(), editTask.dueDate(), editTask.remindAt());
    }

    @PatchMapping("/{taskId}/completion")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeCompletion(@PathVariable UUID taskId, @Valid @RequestBody ChangeCompletion request) {
        taskService.changeCompletion(taskId, request.completed());
    }

    @PatchMapping("/{taskId}/importance")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeImportance(@PathVariable UUID taskId, @Valid @RequestBody ChangeImportance request) {
        taskService.changeImportance(taskId, request.important());
    }

    @PatchMapping("/{taskId}/my-day")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeMyDay(@PathVariable UUID taskId, @Valid @RequestBody ChangeMyDay request) {
        taskService.changeMyDay(taskId, request.inMyDay());
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable UUID taskId) {
        taskService.remove(taskId);
    }
}
