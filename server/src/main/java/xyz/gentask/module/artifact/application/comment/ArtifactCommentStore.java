package xyz.gentask.module.artifact.application.comment;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import xyz.gentask.module.artifact.application.comment.ArtifactCommentViews.CommentView;

public interface ArtifactCommentStore {
    boolean insert(
            String id, UUID revisionId, Integer start, Integer end, String body, UUID authorId, Instant createdAt);

    List<CommentView> list(UUID revisionId, int versionNo, String source);

    boolean deleteOwn(String id, UUID revisionId, UUID authorId);
}
