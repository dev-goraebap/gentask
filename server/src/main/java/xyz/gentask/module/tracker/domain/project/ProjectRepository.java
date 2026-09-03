package xyz.gentask.module.tracker.domain.project;

import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository {

    void save(Project project);

    /**
     * 공개 식별자와 소유자 식별자로 프로젝트를 조회한다(PRJ-002 A2).
     */
    Optional<Project> findByPublicId(UUID ownerId, ProjectPublicId publicId);
}
