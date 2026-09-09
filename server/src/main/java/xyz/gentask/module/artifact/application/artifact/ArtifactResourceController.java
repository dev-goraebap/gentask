package xyz.gentask.module.artifact.application.artifact;

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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.gentask.module.artifact.application.artifact.ArtifactRequests.EditArtifact;
import xyz.gentask.module.artifact.application.artifact.ArtifactRequests.MoveArtifact;
import xyz.gentask.module.artifact.application.artifact.ArtifactRequests.RevertVersion;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.ArtifactSummary;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.ArtifactView;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.VersionPageView;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.VersionView;
import xyz.gentask.shared.web.CurrentUser;

@RestController
@RequestMapping("/api/v1/artifacts")
@RequiredArgsConstructor
public class ArtifactResourceController {
    public record CreateScopedArtifact(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 200) String title,

            @jakarta.validation.constraints.Size(max = 100000) String body,

            String folderId,
            String projectId) {}

    private final ArtifactService artifactService;
    private final xyz.gentask.module.artifact.application.ArtifactResources resources;

    @PostMapping
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<Void> add(@CurrentUser UUID userId, @Valid @RequestBody CreateScopedArtifact request) {
        String artifactId =
                artifactService.add(userId, request.projectId(), request.title(), request.body(), request.folderId());
        return ResponseEntity.created(URI.create("/api/v1" + "/artifacts/" + artifactId))
                .build();
    }

    @GetMapping
    public List<ArtifactSummary> list(
            @CurrentUser UUID userId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String projectId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String scope) {
        return resources.list(userId, projectId, scope);
    }

    @GetMapping("/{artifactId}")
    public ArtifactView detail(@CurrentUser UUID userId, @PathVariable String artifactId) {
        return artifactService.detail(userId, resources.artifactProject(userId, artifactId), artifactId);
    }

    @PatchMapping("/{artifactId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @CurrentUser UUID userId, @PathVariable String artifactId, @Valid @RequestBody EditArtifact request) {
        artifactService.edit(
                userId,
                resources.artifactProject(userId, artifactId),
                artifactId,
                request.title(),
                request.body(),
                request.comment());
    }

    @PutMapping("/{artifactId}/folder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void move(
            @CurrentUser UUID userId,
            @PathVariable String artifactId,
            @Valid @RequestBody(required = false) MoveArtifact request) {
        artifactService.move(
                userId,
                resources.artifactProject(userId, artifactId),
                artifactId,
                request == null ? null : request.folderId());
    }

    @GetMapping("/{artifactId}/versions")
    public VersionPageView revisions(
            @CurrentUser UUID userId,
            @PathVariable String artifactId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return artifactService.revisions(userId, resources.artifactProject(userId, artifactId), artifactId, page, size);
    }

    @GetMapping("/{artifactId}/versions/{versionNo}")
    public VersionView revision(
            @CurrentUser UUID userId, @PathVariable String artifactId, @PathVariable String versionNo) {
        return artifactService.revision(userId, resources.artifactProject(userId, artifactId), artifactId, versionNo);
    }

    @PostMapping("/{artifactId}/versions/{versionNo}/revert")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revert(
            @CurrentUser UUID userId,
            @PathVariable String artifactId,
            @PathVariable String versionNo,
            @Valid @RequestBody(required = false) RevertVersion request) {
        artifactService.revert(
                userId,
                resources.artifactProject(userId, artifactId),
                artifactId,
                versionNo,
                request == null ? null : request.comment());
    }
}
