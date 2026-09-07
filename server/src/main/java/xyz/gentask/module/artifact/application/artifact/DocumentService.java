package xyz.gentask.module.artifact.application.artifact;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.artifact.application.ArtifactErrorCode;
import xyz.gentask.module.artifact.application.artifact.DocumentViews.DocumentSummary;
import xyz.gentask.module.artifact.application.artifact.DocumentViews.DocumentView;
import xyz.gentask.module.artifact.application.artifact.DocumentViews.RevisionPageView;
import xyz.gentask.module.artifact.application.artifact.DocumentViews.RevisionSummary;
import xyz.gentask.module.artifact.application.artifact.DocumentViews.RevisionView;
import xyz.gentask.module.artifact.domain.artifact.Document;
import xyz.gentask.module.artifact.domain.artifact.DocumentBody;
import xyz.gentask.module.artifact.domain.artifact.DocumentRepository;
import xyz.gentask.module.artifact.domain.artifact.DocumentRevision;
import xyz.gentask.module.artifact.domain.artifact.DocumentTitle;
import xyz.gentask.module.artifact.domain.artifact.RevisionComment;
import xyz.gentask.module.artifact.domain.folder.DocumentFolder;
import xyz.gentask.module.artifact.domain.folder.DocumentFolderRepository;
import xyz.gentask.module.project.ProjectAccessIn;

@Service
@RequiredArgsConstructor
public class DocumentService {

    // --- 상수 --------------------------------------------------------------------------------------------------------
    /**
     * 이력 한 쪽의 최대 크기.
     *
     * 쪽 번호와 크기로 나눈다. 이 저장소의 목록 API 가 이미 쓰는 규약이라 그것을 따랐고, 이력은
     * 번호가 촘촘히 매겨져 있어 쪽을 건너뛰어 짚는 일이 실제로 일어난다.
     */
    static final int MAX_PAGE_SIZE = 100;

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final DocumentRepository documentRepository;
    private final DocumentFolderRepository documentFolderRepository;
    private final DocumentQuery documentQuery;
    private final ProjectAccessIn projectAccess;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<DocumentSummary> list(UUID userId, String projectId) {
        return documentQuery.findAll(projectAccess.requireAccess(userId, projectId));
    }

    @Transactional(readOnly = true)
    public DocumentView detail(UUID userId, String projectId, String documentId) {
        UUID internalProjectId = projectAccess.requireAccess(userId, projectId);
        return documentQuery
                .findOne(internalProjectId, readId(documentId))
                .orElseThrow(ArtifactErrorCode.DOCUMENT_NOT_FOUND::raise);
    }

    /**
     * 개정 이력 한 쪽. 최근 것부터 낸다(DOC-004).
     *
     * 개정이 하나도 없다는 것은 그 문서가 없다는 뜻이다. 세우는 것이 곧 첫 개정이므로 이력이 빈
     * 문서는 없고, 지워진 것과 남의 것은 조회가 걸러 낸다(DOC-004 A4 · A5).
     */
    @Transactional(readOnly = true)
    public RevisionPageView revisions(UUID userId, String projectId, String documentId, int page, int size) {
        UUID internalProjectId = projectAccess.requireAccess(userId, projectId);
        UUID id = readId(documentId);

        int limitedSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);

        long total = documentQuery.countRevisions(internalProjectId, id);
        if (total == 0) {
            throw ArtifactErrorCode.DOCUMENT_NOT_FOUND.raise();
        }

        List<RevisionSummary> items =
                documentQuery.findRevisions(internalProjectId, id, limitedSize, safePage * limitedSize);
        return new RevisionPageView(items, total, safePage, limitedSize);
    }

    /**
     * 개정 하나. 그때의 제목과 본문을 그대로 낸다(DOC-004).
     *
     * 두 개정의 차이를 여기서 계산하지 않는다. 본문을 그대로 내고 견주는 일은 읽는 쪽이 한다.
     */
    @Transactional(readOnly = true)
    public RevisionView revision(UUID userId, String projectId, String documentId, String revisionNo) {
        UUID internalProjectId = projectAccess.requireAccess(userId, projectId);
        return documentQuery
                .findRevision(internalProjectId, readId(documentId), readRevisionNo(revisionNo))
                .orElseThrow(ArtifactErrorCode.REVISION_NOT_FOUND::raise);
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    /**
     * 문서를 생성하고 초기 개정을 함께 등록한다(DOC-001).
     */
    @Transactional
    public UUID add(UUID userId, String projectId, String title, String body, String folderId) {
        UUID internalProjectId = projectAccess.requireAccess(userId, projectId);
        Instant now = clock.instant();

        Document document = Document.create(
                UUID.randomUUID(),
                internalProjectId,
                DocumentTitle.of(title),
                findFolder(internalProjectId, folderId),
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
     * 문서 내용을 수정하고 신규 개정을 등록한다. 내용 변경이 없는 경우 신규 개정을 생성하지 않는다(DOC-003 A2).
     */
    @Transactional
    public void edit(UUID userId, String projectId, String documentId, String title, String body, String comment) {
        UUID internalProjectId = projectAccess.requireAccess(userId, projectId);
        Document document = documentRepository
                .findById(internalProjectId, readId(documentId))
                .orElseThrow(ArtifactErrorCode.DOCUMENT_NOT_FOUND::raise);
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
     * 지정한 개정 시점으로 문서를 롤백한다. 과거 본문을 담은 신규 개정을 추가 등록한다(DOC-005).
     */
    @Transactional
    public void revert(UUID userId, String projectId, String documentId, String revisionNo, String comment) {
        UUID internalProjectId = projectAccess.requireAccess(userId, projectId);
        Document document = documentRepository
                .findById(internalProjectId, readId(documentId))
                .orElseThrow(ArtifactErrorCode.DOCUMENT_NOT_FOUND::raise);
        int targetNo = readRevisionNo(revisionNo);
        DocumentRevision target = documentRepository
                .findRevisionByNo(document.id(), targetNo)
                .orElseThrow(ArtifactErrorCode.REVISION_NOT_FOUND::raise);
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
     * 문서의 소속 폴더를 변경한다. 내용 변경이 아니므로 개정 이력을 추가하지 않는다(DOC-006).
     */
    @Transactional
    public void move(UUID userId, String projectId, String documentId, String folderId) {
        UUID internalProjectId = projectAccess.requireAccess(userId, projectId);
        Document document = documentRepository
                .findById(internalProjectId, readId(documentId))
                .orElseThrow(ArtifactErrorCode.DOCUMENT_NOT_FOUND::raise);

        UUID target = findFolder(internalProjectId, folderId);
        if (Objects.equals(document.folderId(), target)) {
            return;
        }

        document.moveTo(target);
        documentRepository.save(document);
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------
    /**
     * 대상 폴더 식별자를 검증하여 반환한다. 미지정 시 null(루트)을 반환한다(DOC-006 A1, A4, A6).
     */
    private UUID findFolder(UUID projectId, String folderId) {
        if (folderId == null || folderId.isBlank()) {
            return null;
        }
        return documentFolderRepository
                .findById(projectId, readFolderId(folderId))
                .map(DocumentFolder::id)
                .orElseThrow(ArtifactErrorCode.FOLDER_NOT_FOUND::raise);
    }

    private static UUID readFolderId(String rawId) {
        try {
            return UUID.fromString(rawId);
        } catch (IllegalArgumentException ignored) {
            throw ArtifactErrorCode.FOLDER_NOT_FOUND.raise();
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
     * 모양이 맞지 않는 것을 잘못된 요청이 아니라 없는 자리로 낸다. 주소에 담긴 값이라 사람이 손으로
     * 고치거나 옛 링크를 따라온 것이다.
     */
    private static UUID readId(String rawId) {
        try {
            return UUID.fromString(rawId);
        } catch (IllegalArgumentException ignored) {
            throw ArtifactErrorCode.DOCUMENT_NOT_FOUND.raise();
        }
    }

    /** 주소에서 받은 개정 번호를 읽는다. 모양이 맞지 않는 것도 없는 자리로 낸다. */
    private static int readRevisionNo(String rawRevisionNo) {
        try {
            return Integer.parseInt(rawRevisionNo);
        } catch (NumberFormatException ignored) {
            throw ArtifactErrorCode.REVISION_NOT_FOUND.raise();
        }
    }
}
