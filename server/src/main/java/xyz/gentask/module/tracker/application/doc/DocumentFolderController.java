package xyz.gentask.module.tracker.application.doc;

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
import xyz.gentask.module.tracker.application.doc.DocumentRequests.CreateFolder;
import xyz.gentask.module.tracker.application.doc.DocumentRequests.MoveFolder;
import xyz.gentask.module.tracker.application.doc.DocumentRequests.RenameFolder;
import xyz.gentask.module.tracker.application.doc.DocumentViews.FolderSummary;
import xyz.gentask.shared.web.CurrentUser;

/**
 * 폴더는 문서와 나란히 프로젝트 아래에 선다.
 *
 * <p>담긴 자리는 이름과 같은 자원에 두지 않고 하위 자원으로 가른다. 최상위로 옮기는 것이 값을 비우는
 * 일이라(DOC-008 A5) 한 몸에 담으면 "적지 않았다"와 "비웠다"가 같은 모양이 된다.
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/document-folders")
@RequiredArgsConstructor
public class DocumentFolderController {

    private final DocumentFolderService documentFolderService;

    @PostMapping
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<Void> add(
            @CurrentUser UUID userId, @PathVariable String projectId, @Valid @RequestBody CreateFolder request) {
        UUID folderId = documentFolderService.add(userId, projectId, request.name(), request.parentId());
        return ResponseEntity.created(URI.create("/api/v1/projects/" + projectId + "/document-folders/" + folderId))
                .build();
    }

    @GetMapping
    public List<FolderSummary> list(@CurrentUser UUID userId, @PathVariable String projectId) {
        return documentFolderService.list(userId, projectId);
    }

    @PatchMapping("/{folderId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rename(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable String folderId,
            @Valid @RequestBody RenameFolder request) {
        documentFolderService.rename(userId, projectId, folderId, request.name());
    }

    @PutMapping("/{folderId}/parent")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void move(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable String folderId,
            @Valid @RequestBody(required = false) MoveFolder request) {
        documentFolderService.move(userId, projectId, folderId, request == null ? null : request.parentId());
    }

    @DeleteMapping("/{folderId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@CurrentUser UUID userId, @PathVariable String projectId, @PathVariable String folderId) {
        documentFolderService.remove(userId, projectId, folderId);
    }
}
