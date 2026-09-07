package xyz.gentask.module.artifact.application;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.artifact.ArtifactReferenceIn;
import xyz.gentask.module.artifact.application.artifact.ArtifactService;

@Service
@RequiredArgsConstructor
public class ArtifactReferenceService implements ArtifactReferenceIn {
    private final ArtifactService artifacts;

    @Override
    @Transactional(readOnly = true)
    public void requireReference(UUID userId, String projectId, String artifactId) {
        artifacts.detail(userId, projectId, artifactId);
    }
}
