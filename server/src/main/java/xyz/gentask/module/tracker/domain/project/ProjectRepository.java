package xyz.gentask.module.tracker.domain.project;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository {

    void save(Project project);

    /** 주소가 접두어를 갖는다. 소유자 안에서만 유일하므로 둘을 함께 받는다. */
    Optional<Project> findByKey(UUID ownerId, ProjectKey key);

    /** 그 소유자가 이미 쓰고 있는 접두어. 겹치지 않는 것을 뽑는 데 쓴다 (PRJ-001 A2). */
    List<ProjectKey> findKeysOwnedBy(UUID ownerId);
}
