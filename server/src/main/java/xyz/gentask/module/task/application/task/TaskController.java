package xyz.gentask.module.task.application.task;

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
import xyz.gentask.module.task.application.task.TaskRequests.ChangeCompletion;
import xyz.gentask.module.task.application.task.TaskRequests.ChangeImportance;
import xyz.gentask.module.task.application.task.TaskRequests.ChangeMyDay;
import xyz.gentask.module.task.application.task.TaskRequests.CreateTask;
import xyz.gentask.module.task.application.task.TaskRequests.EditTask;
import xyz.gentask.module.task.application.task.TaskViews.TaskView;
import xyz.gentask.shared.web.CurrentUser;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<Void> add(@CurrentUser UUID userId, @Valid @RequestBody CreateTask createTask) {
        UUID taskId = taskService.add(userId, createTask.title(), createTask.dueDate());
        return ResponseEntity.created(URI.create("/api/v1/tasks/" + taskId)).build();
    }

    @GetMapping
    public List<TaskView> list(@CurrentUser UUID userId) {
        return taskService.list(userId);
    }

    @GetMapping("/{taskId}")
    public TaskView detail(@CurrentUser UUID userId, @PathVariable UUID taskId) {
        return taskService.detail(userId, taskId);
    }

    @PatchMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(@CurrentUser UUID userId, @PathVariable UUID taskId, @Valid @RequestBody EditTask editTask) {
        taskService.edit(userId, taskId, editTask.title(), editTask.note(), editTask.dueDate(), editTask.remindAt());
    }

    @PatchMapping("/{taskId}/completion")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeCompletion(
            @CurrentUser UUID userId, @PathVariable UUID taskId, @Valid @RequestBody ChangeCompletion request) {
        taskService.changeCompletion(userId, taskId, request.completed());
    }

    @PatchMapping("/{taskId}/importance")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeImportance(
            @CurrentUser UUID userId, @PathVariable UUID taskId, @Valid @RequestBody ChangeImportance request) {
        taskService.changeImportance(userId, taskId, request.important());
    }

    @PatchMapping("/{taskId}/my-day")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeMyDay(
            @CurrentUser UUID userId, @PathVariable UUID taskId, @Valid @RequestBody ChangeMyDay request) {
        taskService.changeMyDay(userId, taskId, request.inMyDay());
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@CurrentUser UUID userId, @PathVariable UUID taskId) {
        taskService.remove(userId, taskId);
    }
}
