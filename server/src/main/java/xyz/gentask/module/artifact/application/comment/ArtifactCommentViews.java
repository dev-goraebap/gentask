package xyz.gentask.module.artifact.application.comment;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

public final class ArtifactCommentViews {
    private ArtifactCommentViews() {}

    @Schema(
            name = "ArtifactCommentView",
            requiredProperties = {"id", "versionNo", "body", "authorId", "authorName", "createdAt"})
    public record CommentView(
            String id,
            int versionNo,
            Integer blockStart,
            Integer blockEnd,
            String blockSource,
            String body,
            UUID authorId,
            String authorName,
            Instant createdAt,
            String textAnchor) {}
}
