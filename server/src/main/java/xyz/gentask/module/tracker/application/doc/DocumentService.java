package xyz.gentask.module.tracker.application.doc;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.tracker.application.TrackerErrorCode;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentSummary;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentView;
import xyz.gentask.module.tracker.application.project.ProjectService;
import xyz.gentask.module.tracker.domain.doc.Document;
import xyz.gentask.module.tracker.domain.doc.DocumentBody;
import xyz.gentask.module.tracker.domain.doc.DocumentRepository;
import xyz.gentask.module.tracker.domain.doc.DocumentRevision;
import xyz.gentask.module.tracker.domain.doc.DocumentTitle;
import xyz.gentask.module.tracker.domain.doc.RevisionComment;
import xyz.gentask.module.tracker.domain.project.Project;

@Service
@RequiredArgsConstructor
public class DocumentService {

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final DocumentRepository documentRepository;
    private final DocumentQuery documentQuery;
    private final ProjectService projectService;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<DocumentSummary> list(UUID userId, String projectId) {
        return documentQuery.findAll(projectService.find(userId, projectId).id());
    }

    @Transactional(readOnly = true)
    public DocumentView detail(UUID userId, String projectId, String documentId) {
        Project project = projectService.find(userId, projectId);
        return documentQuery
                .findOne(project.id(), readId(documentId))
                .orElseThrow(TrackerErrorCode.DOCUMENT_NOT_FOUND::raise);
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    /**
     * 문서를 세우고 첫 개정을 함께 남긴다.
     *
     * <p>본문을 둘 자리가 개정뿐이므로 개정 없는 문서는 서지 않는다. 문서를 먼저 담고 개정을 담은 뒤에
     * 가리키며, 그 사이는 한 트랜잭션 안이다(DOC-001).
     */
    @Transactional
    public UUID add(UUID userId, String projectId, String title, String body) {
        Project project = projectService.find(userId, projectId);
        Instant now = clock.instant();

        Document document = Document.create(UUID.randomUUID(), project.id(), DocumentTitle.of(title), userId, now);
        documentRepository.save(document);

        DocumentRevision first = DocumentRevision.first(
                UUID.randomUUID(),
                document.id(),
                document.title(),
                DocumentBody.of(body),
                RevisionComment.none(),
                userId,
                now);
        documentRepository.append(first);

        document.moveHead(first.id(), first.title(), userId, now);
        documentRepository.save(document);
        return document.id();
    }

    /**
     * 고쳐서 새 개정을 남긴다.
     *
     * <p>앞의 개정을 고치거나 지우지 않는다. 새것을 담고 문서가 가리키는 자리만 옮겨 간다.
     *
     * <p>담으려는 것이 앞의 개정과 같으면 아무것도 담지 않고 성공으로 답한다. 사용자가 한 일은
     * 저장이었고 그 결과는 "적은 대로 남아 있다"이므로 실패가 아니다(DOC-003 A2).
     */
    @Transactional
    public void edit(UUID userId, String projectId, String documentId, String title, String body, String comment) {
        Project project = projectService.find(userId, projectId);
        Document document = documentRepository
                .findById(project.id(), readId(documentId))
                .orElseThrow(TrackerErrorCode.DOCUMENT_NOT_FOUND::raise);
        DocumentRevision head = head(document);

        DocumentTitle newTitle = DocumentTitle.of(title);
        DocumentBody newBody = DocumentBody.of(body);
        if (head.hasSameContent(newTitle, newBody)) {
            return;
        }

        Instant now = clock.instant();
        DocumentRevision next =
                head.next(UUID.randomUUID(), newTitle, newBody, RevisionComment.of(comment), userId, now);
        documentRepository.append(next);

        document.moveHead(next.id(), next.title(), userId, now);
        documentRepository.save(document);
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------
    private DocumentRevision head(Document document) {
        if (document.headRevisionId() == null) {
            throw new IllegalStateException("개정 없는 문서가 서 있다");
        }
        return documentRepository
                .findRevisionById(document.headRevisionId())
                .orElseThrow(() -> new IllegalStateException("문서가 가리키는 개정이 없다"));
    }

    /**
     * 주소에서 받은 식별자를 읽는다.
     *
     * <p>모양이 맞지 않는 것을 잘못된 요청이 아니라 없는 자리로 낸다. 주소에 담긴 값이라 사람이 손으로
     * 고치거나 옛 링크를 따라온 것이다.
     */
    private static UUID readId(String rawId) {
        try {
            return UUID.fromString(rawId);
        } catch (IllegalArgumentException ignored) {
            throw TrackerErrorCode.DOCUMENT_NOT_FOUND.raise();
        }
    }
}
