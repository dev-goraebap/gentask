package xyz.gentask.module.tracker.application.doc;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.tracker.application.TrackerErrorCode;
import xyz.gentask.module.tracker.application.doc.DocumentViews.FolderSummary;
import xyz.gentask.module.tracker.application.project.ProjectService;
import xyz.gentask.module.tracker.domain.doc.Document;
import xyz.gentask.module.tracker.domain.doc.DocumentFolder;
import xyz.gentask.module.tracker.domain.doc.DocumentFolderName;
import xyz.gentask.module.tracker.domain.doc.DocumentFolderRepository;
import xyz.gentask.module.tracker.domain.doc.DocumentRepository;
import xyz.gentask.module.tracker.domain.project.Project;

/**
 * 폴더를 세우고 이름을 바꾸고 옮기고 지운다(DOC-008).
 *
 * 넷이 목표 하나를 나눠 갖는다. 폴더는 그 자체로 읽을 것을 담지 않고 문서를 어디에 둘지만 정하므로
 * 한 자리에 둔다.
 */
@Service
@RequiredArgsConstructor
public class DocumentFolderService {

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final DocumentFolderRepository documentFolderRepository;
    private final DocumentRepository documentRepository;
    private final DocumentQuery documentQuery;
    private final ProjectService projectService;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------
    /**
     * 프로젝트의 폴더 전부를 평평하게 낸다.
     *
     * 트리로 조립하지 않는다. 깊이를 제한하지 않으므로(DOC-008) 조립한 모양이 한 화면에 담기지
     * 않고, 어느 자리를 펼쳐 둘지는 보는 쪽이 안다.
     */
    @Transactional(readOnly = true)
    public List<FolderSummary> list(UUID userId, String projectId) {
        return documentQuery.findFolders(projectService.find(userId, projectId).id());
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    /** 지금 자리 아래에 폴더를 세운다. 같은 이름이 이미 있어도 막지 않는다(DOC-008 A2). */
    @Transactional
    public UUID add(UUID userId, String projectId, String name, String parentId) {
        Project project = projectService.find(userId, projectId);
        DocumentFolder folder = DocumentFolder.create(
                UUID.randomUUID(),
                project.id(),
                DocumentFolderName.of(name),
                findParent(project.id(), parentId),
                userId,
                clock.instant());
        documentFolderRepository.save(folder);
        return folder.id();
    }

    @Transactional
    public void rename(UUID userId, String projectId, String folderId, String name) {
        Project project = projectService.find(userId, projectId);
        DocumentFolder folder = find(project.id(), folderId);
        folder.rename(DocumentFolderName.of(name), userId, clock.instant());
        documentFolderRepository.save(folder);
    }

    /**
     * 폴더를 대상 상위 폴더 하위로 이동한다. 하위 문서 및 자식 폴더가 함께 이동한다(DOC-008 A5).
     * 자기 자신이나 하위 자손 폴더로는 이동할 수 없다(DOC-008 A6).
     */
    @Transactional
    public void move(UUID userId, String projectId, String folderId, String parentId) {
        Project project = projectService.find(userId, projectId);
        DocumentFolder folder = find(project.id(), folderId);
        UUID targetId = findParent(project.id(), parentId);

        ensureNotItselfOrDescendant(project.id(), folder.id(), targetId);

        folder.moveTo(targetId, userId, clock.instant());
        documentFolderRepository.save(folder);
    }

    /**
     * 폴더를 삭제한다. 소속 문서 및 하위 폴더는 1단계 상위 계층으로 승격된다(DOC-008 A7).
     */
    @Transactional
    public void remove(UUID userId, String projectId, String folderId) {
        Project project = projectService.find(userId, projectId);
        DocumentFolder folder = find(project.id(), folderId);
        Instant now = clock.instant();

        for (DocumentFolder child : documentFolderRepository.findChildren(folder.id())) {
            child.moveTo(folder.parentId(), userId, now);
            documentFolderRepository.save(child);
        }
        for (Document document : documentRepository.findAllInFolder(folder.id())) {
            document.moveTo(folder.parentId());
            documentRepository.save(document);
        }
        documentFolderRepository.deleteById(folder.id());
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------
    private DocumentFolder find(UUID projectId, String folderId) {
        return documentFolderRepository
                .findById(projectId, readId(folderId))
                .orElseThrow(TrackerErrorCode.FOLDER_NOT_FOUND::raise);
    }

    /** 상위 폴더 식별자를 조회한다. 미지정 시 null(최상위 루트)을 반환한다(DOC-006 A1). */
    private UUID findParent(UUID projectId, String parentId) {
        if (parentId == null || parentId.isBlank()) {
            return null;
        }
        return find(projectId, parentId).id();
    }

    /**
     * 옮길 자리가 그 폴더 자신이거나 그 아래가 아님을 본다.
     *
     * 고른 자리에서 위로 걸어 올라가며 자신을 만나는지 본다. 트리에 고리가 없으므로 걸음은 뿌리에서
     * 끝난다.
     */
    private void ensureNotItselfOrDescendant(UUID projectId, UUID folderId, UUID targetId) {
        UUID cursor = targetId;
        while (cursor != null) {
            if (cursor.equals(folderId)) {
                throw TrackerErrorCode.FOLDER_MOVE_INTO_DESCENDANT.raise();
            }
            cursor = documentFolderRepository
                    .findById(projectId, cursor)
                    .map(DocumentFolder::parentId)
                    .orElse(null);
        }
    }

    /**
     * 주소나 본문에서 받은 식별자를 읽는다.
     *
     * 모양이 맞지 않는 것을 잘못된 요청이 아니라 없는 자리로 낸다. 사람이 손으로 고치거나 옛 링크를
     * 따라온 것이다.
     */
    private static UUID readId(String rawId) {
        try {
            return UUID.fromString(rawId);
        } catch (IllegalArgumentException ignored) {
            throw TrackerErrorCode.FOLDER_NOT_FOUND.raise();
        }
    }
}
