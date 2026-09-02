package xyz.gentask.module.tracker.domain.project;

import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository {

    void save(Project project);

    /**
     * 주소가 담는 식별자로 찾는다.
     *
     * <p>소유자를 함께 받는다. 식별자가 전역으로 유일하므로 그것만으로 하나가 가려지지만, 남의 것을
     * 그 자리에서 걸러야 "있으나 권한이 없다"가 새어 나가지 않는다(PRJ-002 A2).
     */
    Optional<Project> findByPublicId(UUID ownerId, ProjectPublicId publicId);
}
