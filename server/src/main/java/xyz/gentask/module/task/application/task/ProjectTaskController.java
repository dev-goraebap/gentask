package xyz.gentask.module.task.application.task;

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
import xyz.gentask.shared.web.CurrentUser;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/projects/{projectId}/tasks")
public class ProjectTaskController {
    private final TaskService tasks;

    @GetMapping
    public List<TaskViews.TaskView> list(@CurrentUser UUID userId, @PathVariable String projectId) {
        return tasks.listProject(userId, projectId);
    }

    @PostMapping
    public ResponseEntity<Void> add(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @Valid @RequestBody TaskRequests.CreateTask request) {
        UUID id = tasks.addProject(userId, projectId, request.title(), request.dueDate());
        return ResponseEntity.created(URI.create("/api/v1/tasks/" + id)).build();
    }
}
