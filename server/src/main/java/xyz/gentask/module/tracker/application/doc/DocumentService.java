package xyz.gentask.module.tracker.application.doc;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.tracker.application.TrackerErrorCode;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentSummary;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentView;
import xyz.gentask.module.tracker.application.doc.DocumentViews.RevisionPageView;
import xyz.gentask.module.tracker.application.doc.DocumentViews.RevisionSummary;
import xyz.gentask.module.tracker.application.doc.DocumentViews.RevisionView;
import xyz.gentask.module.tracker.application.project.ProjectService;
import xyz.gentask.module.tracker.domain.doc.Document;
import xyz.gentask.module.tracker.domain.doc.DocumentBody;
import xyz.gentask.module.tracker.domain.doc.DocumentFolder;
import xyz.gentask.module.tracker.domain.doc.DocumentFolderRepository;
import xyz.gentask.module.tracker.domain.doc.DocumentRepository;
import xyz.gentask.module.tracker.domain.doc.DocumentRevision;
import xyz.gentask.module.tracker.domain.doc.DocumentTitle;
import xyz.gentask.module.tracker.domain.doc.RevisionComment;
import xyz.gentask.module.tracker.domain.project.Project;

@Service
@RequiredArgsConstructor
public class DocumentService {

    // --- 상수 --------------------------------------------------------------------------------------------------------
    /**
     * 이력 한 쪽의 최대 크기.
     *
     * <p>쪽 번호와 크기로 나눈다. 이 저장소의 목록 API 가 이미 쓰는 규약이라 그것을 따랐고, 이력은
     * 번호가 촘촘히 매겨져 있어 쪽을 건너뛰어 짚는 일이 실제로 일어난다.
     */
    static final int MAX_PAGE_SIZE = 100;

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final DocumentRepository documentRepository;
    private final DocumentFolderRepository documentFolderRepository;
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

    /**
     * 개정 이력 한 쪽. 최근 것부터 낸다(DOC-004).
     *
     * <p>개정이 하나도 없다는 것은 그 문서가 없다는 뜻이다. 세우는 것이 곧 첫 개정이므로 이력이 빈
     * 문서는 없고, 지워진 것과 남의 것은 조회가 걸러 낸다(DOC-004 A4 · A5).
     */
    @Transactional(readOnly = true)
    public RevisionPageView revisions(UUID userId, String projectId, String documentId, int page, int size) {
        Project project = projectService.find(userId, projectId);
        UUID id = readId(documentId);

        int limitedSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);

        long total = documentQuery.countRevisions(project.id(), id);
        if (total == 0) {
            throw TrackerErrorCode.DOCUMENT_NOT_FOUND.raise();
        }

        List<RevisionSummary> items =
                documentQuery.findRevisions(project.id(), id, limitedSize, safePage * limitedSize);
        return new RevisionPageView(items, total, safePage, limitedSize);
    }

    /**
     * 개정 하나. 그때의 제목과 본문을 그대로 낸다(DOC-004).
     *
     * <p>두 개정의 차이를 여기서 계산하지 않는다. 본문을 그대로 내고 견주는 일은 읽는 쪽이 한다.
     */
    @Transactional(readOnly = true)
    public RevisionView revision(UUID userId, String projectId, String documentId, String revisionNo) {
        Project project = projectService.find(userId, projectId);
        return documentQuery
                .findRevision(project.id(), readId(documentId), readRevisionNo(revisionNo))
                .orElseThrow(TrackerErrorCode.REVISION_NOT_FOUND::raise);
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    /**
     * 문서를 세우고 첫 개정을 함께 남긴다.
     *
     * <p>본문을 둘 자리가 개정뿐이므로 개정 없는 문서는 서지 않는다. 문서를 먼저 담고 개정을 담은 뒤에
     * 가리키며, 그 사이는 한 트랜잭션 안이다(DOC-001).
     */
    @Transactional
    public UUID add(UUID userId, String projectId, String title, String body, String folderId) {
        Project project = projectService.find(userId, projectId);
        Instant now = clock.instant();

        Document document = Document.create(
                UUID.randomUUID(),
                project.id(),
                DocumentTitle.of(title),
                findFolder(project.id(), folderId),
                userId,
                now);
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

    /**
     * 고른 개정으로 되돌린다.
     *
     * <p>사이의 개정을 지우지 않는다. 고른 개정의 제목과 본문을 담은 새 개정을 남기고 문서가 그것을
     * 가리키게 한다. 그래서 되돌린 것을 다시 되돌릴 수 있다(DOC-005).
     *
     * <p>고른 개정이 지금 참인 것과 같으면 아무것도 담지 않고 성공으로 답한다. 고쳐 담는 자리와 같은
     * 규칙이며 되돌리기라고 예외를 두지 않는다(DOC-005 A2).
     */
    @Transactional
    public void revert(UUID userId, String projectId, String documentId, String revisionNo, String comment) {
        Project project = projectService.find(userId, projectId);
        Document document = documentRepository
                .findById(project.id(), readId(documentId))
                .orElseThrow(TrackerErrorCode.DOCUMENT_NOT_FOUND::raise);
        int targetNo = readRevisionNo(revisionNo);
        DocumentRevision target = documentRepository
                .findRevisionByNo(document.id(), targetNo)
                .orElseThrow(TrackerErrorCode.REVISION_NOT_FOUND::raise);
        DocumentRevision head = head(document);

        if (head.hasSameContent(target.title(), target.body())) {
            return;
        }

        Instant now = clock.instant();
        DocumentRevision next = head.next(
                UUID.randomUUID(), target.title(), target.body(), revertReason(comment, targetNo), userId, now);
        documentRepository.append(next);

        document.moveHead(next.id(), next.title(), userId, now);
        documentRepository.save(document);
    }

    /**
     * 문서가 담긴 자리를 바꾼다(DOC-006).
     *
     * <p>개정을 남기지 않는다. 개정이 갖는 것은 문서가 말하는 바이고 어느 폴더에 있는지는 그것과
     * 무관하다. 고친 때도 따라가지 않으므로 목록의 순서가 옮김으로 흔들리지 않는다.
     *
     * <p>고른 자리가 지금 담긴 자리와 같으면 아무것도 바꾸지 않는다(DOC-006 A5).
     */
    @Transactional
    public void move(UUID userId, String projectId, String documentId, String folderId) {
        Project project = projectService.find(userId, projectId);
        Document document = documentRepository
                .findById(project.id(), readId(documentId))
                .orElseThrow(TrackerErrorCode.DOCUMENT_NOT_FOUND::raise);

        UUID target = findFolder(project.id(), folderId);
        if (Objects.equals(document.folderId(), target)) {
            return;
        }

        document.moveTo(target);
        documentRepository.save(document);
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------
    /**
     * 담길 자리. 적지 않은 것과 비운 것을 가르지 않으며 둘 다 뿌리다(DOC-006 A1).
     *
     * <p>옮길 수 있는 자리는 같은 프로젝트 안의 폴더뿐이다. 남의 것과 이미 지워진 것은 그 자리가 없는
     * 것으로 답한다(DOC-006 A4 · A6).
     */
    private UUID findFolder(UUID projectId, String folderId) {
        if (folderId == null || folderId.isBlank()) {
            return null;
        }
        return documentFolderRepository
                .findById(projectId, readFolderId(folderId))
                .map(DocumentFolder::id)
                .orElseThrow(TrackerErrorCode.FOLDER_NOT_FOUND::raise);
    }

    private static UUID readFolderId(String rawId) {
        try {
            return UUID.fromString(rawId);
        } catch (IllegalArgumentException ignored) {
            throw TrackerErrorCode.FOLDER_NOT_FOUND.raise();
        }
    }

    /** 되돌린 이유를 적지 않으면 몇 번째 개정으로 되돌렸는지를 시스템이 적는다(DOC-005 A3). */
    private static RevisionComment revertReason(String rawComment, int revisionNo) {
        RevisionComment comment = RevisionComment.of(rawComment);
        return comment.isPresent() ? comment : RevisionComment.revertedTo(revisionNo);
    }

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

    /** 주소에서 받은 개정 번호를 읽는다. 모양이 맞지 않는 것도 없는 자리로 낸다. */
    private static int readRevisionNo(String rawRevisionNo) {
        try {
            return Integer.parseInt(rawRevisionNo);
        } catch (NumberFormatException ignored) {
            throw TrackerErrorCode.REVISION_NOT_FOUND.raise();
        }
    }
}
