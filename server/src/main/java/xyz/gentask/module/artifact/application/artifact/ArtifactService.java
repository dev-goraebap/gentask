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
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.ArtifactSummary;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.ArtifactView;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.VersionPageView;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.VersionSummary;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.VersionView;
import xyz.gentask.module.artifact.domain.artifact.Artifact;
import xyz.gentask.module.artifact.domain.artifact.ArtifactBody;
import xyz.gentask.module.artifact.domain.artifact.ArtifactRepository;
import xyz.gentask.module.artifact.domain.artifact.ArtifactRevision;
import xyz.gentask.module.artifact.domain.artifact.ArtifactTitle;
import xyz.gentask.module.artifact.domain.artifact.RevisionComment;
import xyz.gentask.module.artifact.domain.folder.ArtifactFolder;
import xyz.gentask.module.artifact.domain.folder.ArtifactFolderRepository;
import xyz.gentask.module.project.ProjectAccessIn;
import xyz.gentask.shared.domain.NanoId;

@Service
@RequiredArgsConstructor
public class ArtifactService {

    // --- 상수 --------------------------------------------------------------------------------------------------------
    /**
     * 이력 한 쪽의 최대 크기.
     *
     * 쪽 번호와 크기로 나눈다. 이 저장소의 목록 API 가 이미 쓰는 규약이라 그것을 따랐고, 이력은
     * 번호가 촘촘히 매겨져 있어 쪽을 건너뛰어 짚는 일이 실제로 일어난다.
     */
    static final int MAX_PAGE_SIZE = 100;

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final ArtifactRepository artifactRepository;
    private final ArtifactFolderRepository artifactFolderRepository;
    private final ArtifactQuery artifactQuery;
    private final ProjectAccessIn projectAccess;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<ArtifactSummary> list(UUID userId, String projectId) {
        return artifactQuery.findAll(projectAccess.requireAccess(userId, projectId));
    }

    @Transactional(readOnly = true)
    public ArtifactView detail(UUID userId, String projectId, String artifactId) {
        String accessibleProjectId = projectAccess.requireAccess(userId, projectId);
        return artifactQuery
                .findOne(accessibleProjectId, readId(artifactId))
                .orElseThrow(ArtifactErrorCode.ARTIFACT_NOT_FOUND::raise);
    }

    /**
     * 개정 이력 한 쪽. 최근 것부터 낸다(DOC-004).
     *
     * 개정이 하나도 없다는 것은 그 아티팩트가 없다는 뜻이다. 세우는 것이 곧 첫 개정이므로 이력이 빈
     * 아티팩트는 없고, 지워진 것과 남의 것은 조회가 걸러 낸다(DOC-004 A4 · A5).
     */
    @Transactional(readOnly = true)
    public VersionPageView revisions(UUID userId, String projectId, String artifactId, int page, int size) {
        String accessibleProjectId = projectAccess.requireAccess(userId, projectId);
        String id = readId(artifactId);

        int limitedSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);

        long total = artifactQuery.countRevisions(accessibleProjectId, id);
        if (total == 0) {
            throw ArtifactErrorCode.ARTIFACT_NOT_FOUND.raise();
        }

        List<VersionSummary> items =
                artifactQuery.findRevisions(accessibleProjectId, id, limitedSize, safePage * limitedSize);
        return new VersionPageView(items, total, safePage, limitedSize);
    }

    /**
     * 개정 하나. 그때의 제목과 본문을 그대로 낸다(DOC-004).
     *
     * 두 개정의 차이를 여기서 계산하지 않는다. 본문을 그대로 내고 견주는 일은 읽는 쪽이 한다.
     */
    @Transactional(readOnly = true)
    public VersionView revision(UUID userId, String projectId, String artifactId, String revisionNo) {
        String accessibleProjectId = projectAccess.requireAccess(userId, projectId);
        return artifactQuery
                .findRevision(accessibleProjectId, readId(artifactId), readRevisionNo(revisionNo))
                .orElseThrow(ArtifactErrorCode.REVISION_NOT_FOUND::raise);
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    /**
     * 아티팩트를 생성하고 초기 개정을 함께 등록한다(DOC-001).
     */
    @Transactional
    public String add(UUID userId, String projectId, String title, String body, String folderId) {
        String accessibleProjectId = projectAccess.requireAccess(userId, projectId);
        Instant now = clock.instant();

        Artifact artifact = NanoId.create(
                id -> Artifact.create(
                        id,
                        accessibleProjectId,
                        ArtifactTitle.of(title),
                        findFolder(accessibleProjectId, folderId),
                        userId,
                        now),
                artifactRepository::insert);

        ArtifactRevision first = ArtifactRevision.first(
                UUID.randomUUID(),
                artifact.id(),
                artifact.title(),
                ArtifactBody.of(body),
                RevisionComment.none(),
                userId,
                now);
        artifactRepository.append(first);

        artifact.moveHead(first.id(), first.title(), userId, now);
        artifactRepository.save(artifact);
        return artifact.id();
    }

    /**
     * 아티팩트 내용을 수정하고 신규 개정을 등록한다. 내용 변경이 없는 경우 신규 개정을 생성하지 않는다(DOC-003 A2).
     */
    @Transactional
    public void edit(UUID userId, String projectId, String artifactId, String title, String body, String comment) {
        String accessibleProjectId = projectAccess.requireAccess(userId, projectId);
        Artifact artifact = artifactRepository
                .findByIdForUpdate(accessibleProjectId, readId(artifactId))
                .orElseThrow(ArtifactErrorCode.ARTIFACT_NOT_FOUND::raise);
        ArtifactRevision head = head(artifact);

        ArtifactTitle newTitle = ArtifactTitle.of(title);
        ArtifactBody newBody = ArtifactBody.of(body);
        if (head.hasSameContent(newTitle, newBody)) {
            return;
        }

        Instant now = clock.instant();
        ArtifactRevision next =
                head.next(UUID.randomUUID(), newTitle, newBody, RevisionComment.of(comment), userId, now);
        artifactRepository.append(next);

        artifact.moveHead(next.id(), next.title(), userId, now);
        artifactRepository.save(artifact);
    }

    /**
     * 지정한 개정 시점으로 아티팩트를 롤백한다. 과거 본문을 담은 신규 개정을 추가 등록한다(DOC-005).
     */
    @Transactional
    public void revert(UUID userId, String projectId, String artifactId, String revisionNo, String comment) {
        String accessibleProjectId = projectAccess.requireAccess(userId, projectId);
        Artifact artifact = artifactRepository
                .findByIdForUpdate(accessibleProjectId, readId(artifactId))
                .orElseThrow(ArtifactErrorCode.ARTIFACT_NOT_FOUND::raise);
        int targetNo = readRevisionNo(revisionNo);
        ArtifactRevision target = artifactRepository
                .findRevisionByNo(artifact.id(), targetNo)
                .orElseThrow(ArtifactErrorCode.REVISION_NOT_FOUND::raise);
        ArtifactRevision head = head(artifact);

        if (head.hasSameContent(target.title(), target.body())) {
            return;
        }

        Instant now = clock.instant();
        ArtifactRevision next = head.next(
                UUID.randomUUID(), target.title(), target.body(), revertReason(comment, targetNo), userId, now);
        artifactRepository.append(next);

        artifact.moveHead(next.id(), next.title(), userId, now);
        artifactRepository.save(artifact);
    }

    /**
     * 아티팩트의 소속 폴더를 변경한다. 내용 변경이 아니므로 개정 이력을 추가하지 않는다(DOC-006).
     */
    @Transactional
    public void move(UUID userId, String projectId, String artifactId, String folderId) {
        String accessibleProjectId = projectAccess.requireAccess(userId, projectId);
        Artifact artifact = artifactRepository
                .findByIdForUpdate(accessibleProjectId, readId(artifactId))
                .orElseThrow(ArtifactErrorCode.ARTIFACT_NOT_FOUND::raise);

        String target = findFolder(accessibleProjectId, folderId);
        if (Objects.equals(artifact.folderId(), target)) {
            return;
        }

        artifact.moveTo(target);
        artifactRepository.save(artifact);
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------
    /**
     * 대상 폴더 식별자를 검증하여 반환한다. 미지정 시 null(루트)을 반환한다(DOC-006 A1, A4, A6).
     */
    private String findFolder(String projectId, String folderId) {
        if (folderId == null || folderId.isBlank()) {
            return null;
        }
        return artifactFolderRepository
                .findById(projectId, readFolderId(folderId))
                .map(ArtifactFolder::id)
                .orElseThrow(ArtifactErrorCode.FOLDER_NOT_FOUND::raise);
    }

    private static String readFolderId(String rawId) {
        try {
            return NanoId.requireValid(rawId);
        } catch (IllegalArgumentException ignored) {
            throw ArtifactErrorCode.FOLDER_NOT_FOUND.raise();
        }
    }

    /** 되돌린 이유를 적지 않으면 몇 번째 개정으로 되돌렸는지를 시스템이 적는다(DOC-005 A3). */
    private static RevisionComment revertReason(String rawComment, int revisionNo) {
        RevisionComment comment = RevisionComment.of(rawComment);
        return comment.isPresent() ? comment : RevisionComment.revertedTo(revisionNo);
    }

    private ArtifactRevision head(Artifact artifact) {
        if (artifact.headRevisionId() == null) {
            throw new IllegalStateException("개정 없는 아티팩트가 서 있다");
        }
        return artifactRepository
                .findRevisionById(artifact.headRevisionId())
                .orElseThrow(() -> new IllegalStateException("아티팩트가 가리키는 개정이 없다"));
    }

    /**
     * 주소에서 받은 식별자를 읽는다.
     *
     * 모양이 맞지 않는 것을 잘못된 요청이 아니라 없는 자리로 낸다. 주소에 담긴 값이라 사람이 손으로
     * 고치거나 옛 링크를 따라온 것이다.
     */
    private static String readId(String rawId) {
        try {
            return NanoId.requireValid(rawId);
        } catch (IllegalArgumentException ignored) {
            throw ArtifactErrorCode.ARTIFACT_NOT_FOUND.raise();
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
