package xyz.gentask.module.artifact.application.comment;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ArtifactCommentRequests {
    private ArtifactCommentRequests() {}

    @Schema(name = "CreateArtifactComment")
    public record CreateComment(@NotBlank @Size(max = 5000) String body, Integer blockStart, Integer blockEnd) {}
}
