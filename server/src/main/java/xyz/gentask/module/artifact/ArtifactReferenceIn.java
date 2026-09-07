package xyz.gentask.module.artifact;

import java.util.UUID;

public interface ArtifactReferenceIn {
    void requireReference(UUID userId, String projectId, String artifactId);
}
