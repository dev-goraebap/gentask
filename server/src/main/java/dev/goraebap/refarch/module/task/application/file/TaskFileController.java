package dev.goraebap.refarch.module.task.application.file;

import dev.goraebap.refarch.module.task.application.file.TaskFileRequests.AttachTaskFile;
import dev.goraebap.refarch.module.task.application.file.TaskFileViews.TaskFileView;
import dev.goraebap.refarch.shared.web.CurrentUser;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tasks/{taskId}/files")
@RequiredArgsConstructor
public class TaskFileController {

    private final TaskFileService taskFileService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "201", description = "Created")
    public TaskFileView attach(
            @CurrentUser UUID userId, @PathVariable UUID taskId, @Valid @RequestBody AttachTaskFile request) {
        return taskFileService.attach(userId, taskId, request.objectKey(), request.fileName(), request.contentType());
    }

    @GetMapping
    public List<TaskFileView> list(@CurrentUser UUID userId, @PathVariable UUID taskId) {
        return taskFileService.list(userId, taskId);
    }

    @DeleteMapping("/{taskFileId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void detach(@CurrentUser UUID userId, @PathVariable UUID taskId, @PathVariable UUID taskFileId) {
        taskFileService.detach(userId, taskId, taskFileId);
    }
}
