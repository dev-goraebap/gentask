package xyz.gentask.module.project.domain.project;

import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository {

    boolean insert(Project project);

    void save(Project project);

    /**
     * 식별자와 소유자 식별자로 프로젝트를 조회한다(PRJ-002 A2).
     */
    Optional<Project> findById(UUID ownerId, String id);
}
