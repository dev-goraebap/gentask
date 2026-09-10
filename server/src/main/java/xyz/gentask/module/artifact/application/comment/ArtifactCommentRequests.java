package xyz.gentask.module.artifact.application.comment;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ArtifactCommentRequests {
    private ArtifactCommentRequests() {}

    @Schema(name = "CreateArtifactComment")
    public record CreateComment(
            @NotBlank @Size(max = 5000) String body,
            Integer blockStart,
            Integer blockEnd,
            @Size(max = 10000) String textAnchor) {
        public CreateComment(String body, Integer blockStart, Integer blockEnd) {
            this(body, blockStart, blockEnd, null);
        }
    }

    public record EditComment(@NotBlank @Size(max = 5000) String body) {}
}
