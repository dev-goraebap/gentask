package xyz.gentask.module.artifact.application;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.artifact.domain.ArtifactScope;
import xyz.gentask.module.project.ProjectAccessIn;

@Service
@RequiredArgsConstructor
public class ArtifactAccess {
    private final ProjectAccessIn projects;

    @Transactional
    public ArtifactScope requireWrite(UUID userId, String projectId) {
        return projectId == null
                ? new ArtifactScope(null, userId)
                : new ArtifactScope(projects.requireWrite(userId, projectId), null);
    }

    @Transactional(readOnly = true)
    public ArtifactScope requireAccess(UUID userId, String projectId) {
        return projectId == null
                ? new ArtifactScope(null, userId)
                : new ArtifactScope(projects.requireAccess(userId, projectId), null);
    }
}
