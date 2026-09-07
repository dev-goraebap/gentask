package xyz.gentask.module.artifact.application.comment;

import java.time.Clock;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.artifact.application.ArtifactErrorCode;
import xyz.gentask.module.artifact.application.comment.ArtifactCommentRequests.CreateComment;
import xyz.gentask.module.artifact.application.comment.ArtifactCommentViews.CommentView;
import xyz.gentask.module.artifact.domain.artifact.Artifact;
import xyz.gentask.module.artifact.domain.artifact.ArtifactRepository;
import xyz.gentask.module.artifact.domain.artifact.ArtifactRevision;
import xyz.gentask.module.project.ProjectAccessIn;
import xyz.gentask.shared.domain.NanoId;
import xyz.gentask.shared.error.DomainRuleViolation;

@Service
@RequiredArgsConstructor
public class ArtifactCommentService {
    private final ProjectAccessIn projectAccess;
    private final ArtifactRepository artifacts;
    private final ArtifactCommentStore comments;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<CommentView> list(UUID userId, String projectId, String artifactId, int versionNo) {
        String accessible = projectAccess.requireAccess(userId, projectId);
        artifacts.findById(accessible, artifactId).orElseThrow(ArtifactErrorCode.ARTIFACT_NOT_FOUND::raise);
        ArtifactRevision revision = revision(artifactId, versionNo);
        return comments.list(revision.id(), versionNo, revision.body().value());
    }

    @Transactional
    public String add(UUID userId, String projectId, String artifactId, int versionNo, CreateComment request) {
        String accessible = projectAccess.requireAccess(userId, projectId);
        Artifact artifact = artifacts
                .findByIdForUpdate(accessible, artifactId)
                .orElseThrow(ArtifactErrorCode.ARTIFACT_NOT_FOUND::raise);
        ArtifactRevision revision = revision(artifactId, versionNo);
        if (!revision.id().equals(artifact.headRevisionId())) throw ArtifactErrorCode.COMMENT_VERSION_CHANGED.raise();
        String body = request.body() == null ? "" : request.body().strip();
        if (body.isBlank() || body.length() > 5000) throw new DomainRuleViolation("코멘트는 1~5000자로 입력해 주세요");
        validateRange(revision.body().value(), request.blockStart(), request.blockEnd());
        return NanoId.create(
                id -> id,
                id -> comments.insert(
                        id, revision.id(), request.blockStart(), request.blockEnd(), body, userId, clock.instant()));
    }

    @Transactional
    public void delete(UUID userId, String projectId, String artifactId, int versionNo, String commentId) {
        String accessible = projectAccess.requireAccess(userId, projectId);
        Artifact artifact = artifacts
                .findByIdForUpdate(accessible, artifactId)
                .orElseThrow(ArtifactErrorCode.ARTIFACT_NOT_FOUND::raise);
        ArtifactRevision revision = revision(artifactId, versionNo);
        if (!revision.id().equals(artifact.headRevisionId())) throw ArtifactErrorCode.COMMENT_VERSION_CHANGED.raise();
        if (!comments.deleteOwn(commentId, revision.id(), userId)) throw ArtifactErrorCode.COMMENT_NOT_FOUND.raise();
    }

    private ArtifactRevision revision(String artifactId, int versionNo) {
        return artifacts
                .findRevisionByNo(artifactId, versionNo)
                .orElseThrow(ArtifactErrorCode.REVISION_NOT_FOUND::raise);
    }

    private static void validateRange(String source, Integer start, Integer end) {
        if (start == null && end == null) return;
        if (start == null
                || end == null
                || start < 0
                || end <= start
                || end > source.length()
                || splitsSurrogate(source, start)
                || splitsSurrogate(source, end)
                || source.substring(start, end).isBlank()) {
            throw new DomainRuleViolation("본문의 유효한 블록 범위를 지정해 주세요");
        }
    }

    private static boolean splitsSurrogate(String source, int offset) {
        return offset > 0
                && offset < source.length()
                && Character.isHighSurrogate(source.charAt(offset - 1))
                && Character.isLowSurrogate(source.charAt(offset));
    }
}
