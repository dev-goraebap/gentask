package xyz.gentask.module.artifact.application.folder;

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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.gentask.module.artifact.application.artifact.ArtifactRequests.MoveFolder;
import xyz.gentask.module.artifact.application.artifact.ArtifactRequests.RenameFolder;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.FolderSummary;
import xyz.gentask.shared.web.CurrentUser;

@RestController
@RequestMapping("/api/v1/artifact-folders")
@RequiredArgsConstructor
public class ArtifactFolderResourceController {
    public record CreateScopedFolder(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 200) String name,

            String parentId,
            String projectId) {}

    private final ArtifactFolderService artifactFolderService;
    private final xyz.gentask.module.artifact.application.ArtifactResources resources;

    @PostMapping
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<Void> add(@CurrentUser UUID userId, @Valid @RequestBody CreateScopedFolder request) {
        String folderId = artifactFolderService.add(userId, request.projectId(), request.name(), request.parentId());
        return ResponseEntity.created(URI.create("/api/v1" + "/artifact-folders/" + folderId))
                .build();
    }

    @GetMapping
    public List<FolderSummary> list(
            @CurrentUser UUID userId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String projectId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String scope) {
        return resources.folders(userId, projectId, scope);
    }

    @PatchMapping("/{folderId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rename(
            @CurrentUser UUID userId, @PathVariable String folderId, @Valid @RequestBody RenameFolder request) {
        artifactFolderService.rename(userId, resources.folderProject(userId, folderId), folderId, request.name());
    }

    @PutMapping("/{folderId}/parent")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void move(
            @CurrentUser UUID userId,
            @PathVariable String folderId,
            @Valid @RequestBody(required = false) MoveFolder request) {
        artifactFolderService.move(
                userId,
                resources.folderProject(userId, folderId),
                folderId,
                request == null ? null : request.parentId());
    }

    @DeleteMapping("/{folderId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@CurrentUser UUID userId, @PathVariable String folderId) {
        artifactFolderService.remove(userId, resources.folderProject(userId, folderId), folderId);
    }
}
