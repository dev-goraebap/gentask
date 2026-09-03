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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.gentask.module.tracker.application.doc.DocumentRequests.CreateDocument;
import xyz.gentask.module.tracker.application.doc.DocumentRequests.EditDocument;
import xyz.gentask.module.tracker.application.doc.DocumentRequests.MoveDocument;
import xyz.gentask.module.tracker.application.doc.DocumentRequests.RevertRevision;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentSummary;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentView;
import xyz.gentask.module.tracker.application.doc.DocumentViews.RevisionPageView;
import xyz.gentask.module.tracker.application.doc.DocumentViews.RevisionView;
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
        UUID documentId = documentService.add(userId, projectId, request.title(), request.body(), request.folderId());
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

    /**
     * 문서를 다른 자리로 옮긴다(DOC-006).
     *
     * <p>고치는 자리에 얹지 않는다. 그쪽은 제목과 본문을 담아 개정을 남기는 길인데 옮기는 것은 개정이
     * 아니며, 최상위로 옮기는 것이 값을 비우는 일이라 한 몸에 담으면 "적지 않았다"와 "뿌리로"가 같은
     * 모양이 된다.
     */
    @PutMapping("/{documentId}/folder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void move(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable String documentId,
            @Valid @RequestBody(required = false) MoveDocument request) {
        documentService.move(userId, projectId, documentId, request == null ? null : request.folderId());
    }

    @GetMapping("/{documentId}/revisions")
    public RevisionPageView revisions(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable String documentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return documentService.revisions(userId, projectId, documentId, page, size);
    }

    @GetMapping("/{documentId}/revisions/{revisionNo}")
    public RevisionView revision(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable String documentId,
            @PathVariable String revisionNo) {
        return documentService.revision(userId, projectId, documentId, revisionNo);
    }

    /**
     * 되돌리기.
     *
     * <p>경로에 동사를 두지 않는다는 BE-STY-079 의 예외다. 되돌리기가 만드는 것은 아직 번호가 없는 새
     * 개정이라 그것을 가리키는 자리에 PUT 이나 PATCH 를 걸 수 없고, 이력 자체는 고칠 수 없는 자원이다.
     */
    @PostMapping("/{documentId}/revisions/{revisionNo}/revert")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revert(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable String documentId,
            @PathVariable String revisionNo,
            @Valid @RequestBody(required = false) RevertRevision request) {
        documentService.revert(userId, projectId, documentId, revisionNo, request == null ? null : request.comment());
    }
}
