package xyz.gentask.module.artifact.application.artifact;

import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.gentask.module.artifact.application.artifact.ArtifactRequests.CreateArtifact;
import xyz.gentask.module.artifact.application.artifact.ArtifactRequests.EditArtifact;
import xyz.gentask.module.artifact.application.artifact.ArtifactRequests.MoveArtifact;
import xyz.gentask.module.artifact.application.artifact.ArtifactRequests.RevertVersion;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.ArtifactSummary;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.ArtifactView;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.VersionPageView;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.VersionView;
import xyz.gentask.shared.web.CurrentUser;

/**
 * 아티팩트는 프로젝트 아래에 선다.
 *
 * 주소가 담는 것은 프로젝트의 식별자이며 접두어가 아니다. 아티팩트는 번호를 매기지 않으므로 그 자리에
 * 식별자가 그대로 온다.
 */
@RestController
@RequestMapping("/api/v1/projects/{projectId}/artifacts")
@RequiredArgsConstructor
public class ArtifactController {

    private final ArtifactService artifactService;

    @PostMapping
    @ApiResponse(responseCode = "201", description = "Created")
    public ResponseEntity<Void> add(
            @CurrentUser UUID userId, @PathVariable String projectId, @Valid @RequestBody CreateArtifact request) {
        String artifactId = artifactService.add(userId, projectId, request.title(), request.body(), request.folderId());
        return ResponseEntity.created(URI.create("/api/v1/projects/" + projectId + "/artifacts/" + artifactId))
                .build();
    }

    @GetMapping
    public List<ArtifactSummary> list(@CurrentUser UUID userId, @PathVariable String projectId) {
        return artifactService.list(userId, projectId);
    }

    @GetMapping("/{artifactId}")
    public ArtifactView detail(
            @CurrentUser UUID userId, @PathVariable String projectId, @PathVariable String artifactId) {
        return artifactService.detail(userId, projectId, artifactId);
    }

    @PatchMapping("/{artifactId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable String artifactId,
            @Valid @RequestBody EditArtifact request) {
        artifactService.edit(userId, projectId, artifactId, request.title(), request.body(), request.comment());
    }

    /**
     * 아티팩트를 다른 자리로 옮긴다(DOC-006).
     *
     * 고치는 자리에 얹지 않는다. 그쪽은 제목과 본문을 담아 버전을 남기는 길인데 옮기는 것은 버전이
     * 아니며, 최상위로 옮기는 것이 값을 비우는 일이라 한 몸에 담으면 "적지 않았다"와 "뿌리로"가 같은
     * 모양이 된다.
     */
    @PutMapping("/{artifactId}/folder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void move(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable String artifactId,
            @Valid @RequestBody(required = false) MoveArtifact request) {
        artifactService.move(userId, projectId, artifactId, request == null ? null : request.folderId());
    }

    @GetMapping("/{artifactId}/versions")
    public VersionPageView revisions(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable String artifactId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return artifactService.revisions(userId, projectId, artifactId, page, size);
    }

    @GetMapping("/{artifactId}/versions/{versionNo}")
    public VersionView revision(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable String artifactId,
            @PathVariable String versionNo) {
        return artifactService.revision(userId, projectId, artifactId, versionNo);
    }

    /**
     * 되돌리기.
     *
     * 경로에 동사를 두지 않는다는 BE-STY-079 의 예외다. 되돌리기가 만드는 것은 아직 번호가 없는 새
     * 버전이라 그것을 가리키는 자리에 PUT 이나 PATCH 를 걸 수 없고, 이력 자체는 고칠 수 없는 자원이다.
     */
    @PostMapping("/{artifactId}/versions/{versionNo}/revert")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revert(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable String artifactId,
            @PathVariable String versionNo,
            @Valid @RequestBody(required = false) RevertVersion request) {
        artifactService.revert(userId, projectId, artifactId, versionNo, request == null ? null : request.comment());
    }
}
