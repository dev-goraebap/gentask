package xyz.gentask.module.artifact.application.comment;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.gentask.module.artifact.application.comment.ArtifactCommentRequests.CreateComment;
import xyz.gentask.module.artifact.application.comment.ArtifactCommentViews.CommentView;
import xyz.gentask.shared.web.CurrentUser;

@RestController
@RequiredArgsConstructor
@RequestMapping({
    "/api/v1/projects/{projectId}/artifacts/{artifactId}/versions/{versionNo}/comments",
    "/api/v1/me/artifacts/{artifactId}/versions/{versionNo}/comments"
})
public class ArtifactCommentController {
    private final ArtifactCommentService comments;

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @CurrentUser UUID userId,
            @PathVariable(required = false) String projectId,
            @PathVariable String artifactId,
            @PathVariable int versionNo,
            @PathVariable String commentId) {
        comments.delete(userId, projectId, artifactId, versionNo, commentId);
    }

    @GetMapping
    public List<CommentView> list(
            @CurrentUser UUID userId,
            @PathVariable(required = false) String projectId,
            @PathVariable String artifactId,
            @PathVariable int versionNo) {
        return comments.list(userId, projectId, artifactId, versionNo);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> add(
            @CurrentUser UUID userId,
            @PathVariable(required = false) String projectId,
            @PathVariable String artifactId,
            @PathVariable int versionNo,
            @Valid @RequestBody CreateComment request) {
        return Map.of("id", comments.add(userId, projectId, artifactId, versionNo, request));
    }
}
