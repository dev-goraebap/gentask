package xyz.gentask.module.tracker.application.doc;

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
import xyz.gentask.module.tracker.application.doc.DocumentRequests.CreateDocument;
import xyz.gentask.module.tracker.application.doc.DocumentRequests.EditDocument;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentSummary;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentView;
import xyz.gentask.shared.web.CurrentUser;

/**
 * 문서는 프로젝트 아래에 선다.
 *
 * <p>주소가 담는 것은 프로젝트의 식별자이며 접두어가 아니다. 문서는 번호를 매기지 않으므로 그 자리에
 * 식별자가 그대로 온다.
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<Void> add(
            @CurrentUser UUID userId, @PathVariable String projectId, @Valid @RequestBody CreateDocument request) {
        UUID documentId = documentService.add(userId, projectId, request.title(), request.body());
        return ResponseEntity.created(URI.create("/api/v1/projects/" + projectId + "/documents/" + documentId))
                .build();
    }

    @GetMapping
    public List<DocumentSummary> list(@CurrentUser UUID userId, @PathVariable String projectId) {
        return documentService.list(userId, projectId);
    }

    @GetMapping("/{documentId}")
    public DocumentView detail(
            @CurrentUser UUID userId, @PathVariable String projectId, @PathVariable String documentId) {
        return documentService.detail(userId, projectId, documentId);
    }

    @PatchMapping("/{documentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable String documentId,
            @Valid @RequestBody EditDocument request) {
        documentService.edit(userId, projectId, documentId, request.title(), request.body(), request.comment());
    }
}
