package xyz.gentask.module.tracker.application.project;

import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.gentask.module.tracker.application.project.ProjectRequests.CreateProject;
import xyz.gentask.module.tracker.application.project.ProjectRequests.RenameProject;
import xyz.gentask.module.tracker.application.project.ProjectViews.ProjectView;
import xyz.gentask.shared.web.CurrentUser;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<Void> create(@CurrentUser UUID userId, @Valid @RequestBody CreateProject request) {
        String key = projectService.create(userId, request.name());
        return ResponseEntity.created(URI.create("/api/v1/projects/" + key)).build();
    }

    @GetMapping
    public List<ProjectView> list(@CurrentUser UUID userId) {
        return projectService.list(userId);
    }

    @GetMapping("/{projectKey}")
    public ProjectView detail(@CurrentUser UUID userId, @PathVariable String projectKey) {
        return projectService.detail(userId, projectKey);
    }

    @PatchMapping("/{projectKey}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rename(
            @CurrentUser UUID userId, @PathVariable String projectKey, @Valid @RequestBody RenameProject request) {
        projectService.rename(userId, projectKey, request.name());
    }
}
