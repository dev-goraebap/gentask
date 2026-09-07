package xyz.gentask.module.artifact.domain;

import java.util.UUID;

public record ArtifactScope(String projectId, UUID ownerId) {
    public ArtifactScope {
        if ((projectId == null) == (ownerId == null))
            throw new IllegalArgumentException("Exactly one artifact owner is required");
    }
}
