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
import xyz.gentask.module.task.application.task.TaskRequests.EditTask;
import xyz.gentask.module.task.application.task.TaskViews.TaskView;
import xyz.gentask.shared.web.CurrentUser;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    public record ChangeTaskState(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Pattern(regexp = "TODO|IN_PROGRESS|DONE") String state) {}

    public record AssignTask(UUID assigneeId) {}

    public record ScopedTask(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 200) String title,

            java.time.LocalDate dueDate,
            String projectId) {}

    @PatchMapping("/{taskId}/state")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void state(
            @CurrentUser UUID userId, @PathVariable UUID taskId, @Valid @RequestBody ChangeTaskState request) {
        taskService.changeState(userId, taskId, request.state());
    }

    @PatchMapping("/{taskId}/assignee")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void assign(@CurrentUser UUID userId, @PathVariable UUID taskId, @Valid @RequestBody AssignTask request) {
        taskService.assign(userId, taskId, request.assigneeId());
    }

    @GetMapping("/{taskId}/artifacts")
    public List<TaskLinkStore.LinkedArtifact> artifacts(@CurrentUser UUID userId, @PathVariable UUID taskId) {
        return taskService.linkedArtifacts(userId, taskId);
    }

    @org.springframework.web.bind.annotation.PutMapping("/{taskId}/artifacts/{artifactId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void link(@CurrentUser UUID userId, @PathVariable UUID taskId, @PathVariable String artifactId) {
        taskService.linkArtifact(userId, taskId, artifactId);
    }

    @DeleteMapping("/{taskId}/artifacts/{artifactId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlink(@CurrentUser UUID userId, @PathVariable UUID taskId, @PathVariable String artifactId) {
        taskService.unlinkArtifact(userId, taskId, artifactId);
    }

    @PostMapping
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<Void> add(@CurrentUser UUID userId, @Valid @RequestBody ScopedTask createTask) {
        UUID taskId = createTask.projectId() == null
                ? taskService.add(userId, createTask.title(), createTask.dueDate())
                : taskService.addProject(userId, createTask.projectId(), createTask.title(), createTask.dueDate());
        return ResponseEntity.created(URI.create("/api/v1/tasks/" + taskId)).build();
    }

    @GetMapping
    public List<TaskView> list(
            @CurrentUser UUID userId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String projectId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String scope) {
        return taskService.list(userId, projectId, scope);
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
