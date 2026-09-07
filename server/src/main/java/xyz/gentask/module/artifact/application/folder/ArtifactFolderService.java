package xyz.gentask.module.artifact.application.folder;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.artifact.application.ArtifactAccess;
import xyz.gentask.module.artifact.application.ArtifactErrorCode;
import xyz.gentask.module.artifact.application.artifact.ArtifactQuery;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.FolderSummary;
import xyz.gentask.module.artifact.domain.ArtifactScope;
import xyz.gentask.module.artifact.domain.artifact.Artifact;
import xyz.gentask.module.artifact.domain.artifact.ArtifactRepository;
import xyz.gentask.module.artifact.domain.folder.ArtifactFolder;
import xyz.gentask.module.artifact.domain.folder.ArtifactFolderName;
import xyz.gentask.module.artifact.domain.folder.ArtifactFolderRepository;
import xyz.gentask.shared.domain.NanoId;

/**
 * 폴더를 세우고 이름을 바꾸고 옮기고 지운다(DOC-008).
 *
 * 넷이 목표 하나를 나눠 갖는다. 폴더는 그 자체로 읽을 것을 담지 않고 아티팩트를 어디에 둘지만 정하므로
 * 한 자리에 둔다.
 */
@Service
@RequiredArgsConstructor
public class ArtifactFolderService {

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final ArtifactFolderRepository artifactFolderRepository;
    private final ArtifactRepository artifactRepository;
    private final ArtifactQuery artifactQuery;
    private final ArtifactAccess projectAccess;
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
        return artifactQuery.findFolders(projectAccess.requireAccess(userId, projectId));
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    /** 지금 자리 아래에 폴더를 세운다. 같은 이름이 이미 있어도 막지 않는다(DOC-008 A2). */
    @Transactional
    public String add(UUID userId, String projectId, String name, String parentId) {
        ArtifactScope accessibleProjectId = projectAccess.requireWrite(userId, projectId);
        ArtifactFolder folder = NanoId.create(
                id -> ArtifactFolder.create(
                        id,
                        accessibleProjectId.projectId(),
                        ArtifactFolderName.of(name),
                        findParent(accessibleProjectId, parentId),
                        userId,
                        clock.instant()),
                artifactFolderRepository::insert);
        return folder.id();
    }

    @Transactional
    public void rename(UUID userId, String projectId, String folderId, String name) {
        ArtifactScope accessibleProjectId = projectAccess.requireWrite(userId, projectId);
        ArtifactFolder folder = find(accessibleProjectId, folderId);
        folder.rename(ArtifactFolderName.of(name), userId, clock.instant());
        artifactFolderRepository.save(folder);
    }

    /**
     * 폴더를 대상 상위 폴더 하위로 이동한다. 하위 아티팩트 및 자식 폴더가 함께 이동한다(DOC-008 A5).
     * 자기 자신이나 하위 자손 폴더로는 이동할 수 없다(DOC-008 A6).
     */
    @Transactional
    public void move(UUID userId, String projectId, String folderId, String parentId) {
        ArtifactScope accessibleProjectId = projectAccess.requireWrite(userId, projectId);
        ArtifactFolder folder = find(accessibleProjectId, folderId);
        String targetId = findParent(accessibleProjectId, parentId);

        ensureNotItselfOrDescendant(accessibleProjectId, folder.id(), targetId);

        folder.moveTo(targetId, userId, clock.instant());
        artifactFolderRepository.save(folder);
    }

    /**
     * 폴더를 삭제한다. 소속 아티팩트 및 하위 폴더는 1단계 상위 계층으로 승격된다(DOC-008 A7).
     */
    @Transactional
    public void remove(UUID userId, String projectId, String folderId) {
        ArtifactScope accessibleProjectId = projectAccess.requireWrite(userId, projectId);
        ArtifactFolder folder = find(accessibleProjectId, folderId);
        Instant now = clock.instant();

        for (ArtifactFolder child : artifactFolderRepository.findChildren(folder.id())) {
            child.moveTo(folder.parentId(), userId, now);
            artifactFolderRepository.save(child);
        }
        for (Artifact artifact : artifactRepository.findAllInFolder(folder.id())) {
            artifact.moveTo(folder.parentId());
            artifactRepository.save(artifact);
        }
        artifactFolderRepository.deleteById(folder.id());
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------
    private ArtifactFolder find(ArtifactScope projectId, String folderId) {
        return artifactFolderRepository
                .findById(projectId, readId(folderId))
                .orElseThrow(ArtifactErrorCode.FOLDER_NOT_FOUND::raise);
    }

    /** 상위 폴더 식별자를 조회한다. 미지정 시 null(최상위 루트)을 반환한다(DOC-006 A1). */
    private String findParent(ArtifactScope projectId, String parentId) {
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
    private void ensureNotItselfOrDescendant(ArtifactScope projectId, String folderId, String targetId) {
        String cursor = targetId;
        while (cursor != null) {
            if (cursor.equals(folderId)) {
                throw ArtifactErrorCode.FOLDER_MOVE_INTO_DESCENDANT.raise();
            }
            cursor = artifactFolderRepository
                    .findById(projectId, cursor)
                    .map(ArtifactFolder::parentId)
                    .orElse(null);
        }
    }

    /**
     * 주소나 본문에서 받은 식별자를 읽는다.
     *
     * 모양이 맞지 않는 것을 잘못된 요청이 아니라 없는 자리로 낸다. 사람이 손으로 고치거나 옛 링크를
     * 따라온 것이다.
     */
    private static String readId(String rawId) {
        try {
            return NanoId.requireValid(rawId);
        } catch (IllegalArgumentException ignored) {
            throw ArtifactErrorCode.FOLDER_NOT_FOUND.raise();
        }
    }
}
