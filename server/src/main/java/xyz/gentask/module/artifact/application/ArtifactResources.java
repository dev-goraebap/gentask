package xyz.gentask.module.artifact.application;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.artifact.application.artifact.ArtifactQuery;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.ArtifactSummary;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.FolderSummary;
import xyz.gentask.module.artifact.domain.ArtifactScope;
import xyz.gentask.shared.domain.ResourceFilter;

@Service
@RequiredArgsConstructor
public class ArtifactResources {
    private final ArtifactQuery query;
    private final ArtifactAccess access;

    @Transactional(readOnly = true)
    public List<ArtifactSummary> list(UUID userId, String projectId, String scope) {
        var filter = ResourceFilter.of(projectId, scope);
        return projectId == null && !filter.personal()
                ? query.findVisible(userId)
                : query.findAll(access.requireAccess(userId, projectId));
    }

    @Transactional(readOnly = true)
    public List<FolderSummary> folders(UUID userId, String projectId, String scope) {
        var filter = ResourceFilter.of(projectId, scope);
        return projectId == null && !filter.personal()
                ? query.findVisibleFolders(userId)
                : query.findFolders(access.requireAccess(userId, projectId));
    }

    @Transactional(readOnly = true)
    public String artifactProject(UUID userId, String id) {
        return resolve(userId, query.artifactScope(id).orElseThrow(ArtifactErrorCode.ARTIFACT_NOT_FOUND::raise));
    }

    @Transactional(readOnly = true)
    public String folderProject(UUID userId, String id) {
        return resolve(userId, query.folderScope(id).orElseThrow(ArtifactErrorCode.ARTIFACT_NOT_FOUND::raise));
    }

    @Transactional(readOnly = true)
    public String artifactProject(UUID userId, String id, String expectedProjectId) {
        return expected(artifactProject(userId, id), expectedProjectId);
    }

    @Transactional(readOnly = true)
    public String folderProject(UUID userId, String id, String expectedProjectId) {
        return expected(folderProject(userId, id), expectedProjectId);
    }

    private String expected(String actual, String expected) {
        if (expected != null && !expected.equals(actual)) throw ArtifactErrorCode.ARTIFACT_NOT_FOUND.raise();
        return actual;
    }

    private String resolve(UUID userId, ArtifactScope scope) {
        if (scope.ownerId() != null && !scope.ownerId().equals(userId))
            throw ArtifactErrorCode.ARTIFACT_NOT_FOUND.raise();
        access.requireAccess(userId, scope.projectId());
        return scope.projectId();
    }
}
