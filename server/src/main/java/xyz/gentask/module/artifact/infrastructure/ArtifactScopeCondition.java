package xyz.gentask.module.artifact.infrastructure;

import java.util.UUID;
import org.jooq.Condition;
import org.jooq.Field;
import xyz.gentask.module.artifact.domain.ArtifactScope;

final class ArtifactScopeCondition {
    private ArtifactScopeCondition() {}

    static Condition matches(ArtifactScope scope, Field<String> project, Field<UUID> owner) {
        return scope.projectId() == null
                ? project.isNull().and(owner.eq(scope.ownerId()))
                : project.eq(scope.projectId()).and(owner.isNull());
    }
}
