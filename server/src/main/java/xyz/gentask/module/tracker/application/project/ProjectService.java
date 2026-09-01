package xyz.gentask.module.tracker.application.project;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.tracker.Projects;
import xyz.gentask.module.tracker.application.TrackerErrorCode;
import xyz.gentask.module.tracker.application.project.ProjectViews.ProjectView;
import xyz.gentask.module.tracker.domain.project.Project;
import xyz.gentask.module.tracker.domain.project.ProjectKey;
import xyz.gentask.module.tracker.domain.project.ProjectName;
import xyz.gentask.module.tracker.domain.project.ProjectRepository;

@Service
@RequiredArgsConstructor
public class ProjectService implements Projects {

    /** 접두어가 이만큼 겹치면 뽑기를 포기한다. 사람이 그만큼 같은 이름을 쓰는 경우를 보지 못했다. */
    private static final int KEY_ATTEMPTS = 100;

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final ProjectRepository projectRepository;
    private final ProjectQuery projectQuery;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<ProjectView> list(UUID ownerId) {
        return projectQuery.findAll(ownerId);
    }

    @Transactional(readOnly = true)
    public ProjectView detail(UUID ownerId, UUID projectId) {
        return projectQuery.findOne(projectId, ownerId).orElseThrow(TrackerErrorCode.PROJECT_NOT_FOUND::raise);
    }

    /**
     * 소유를 판정하고 프로젝트를 낸다.
     *
     * <p>남의 것을 없는 것으로 낸다. 있으나 권한이 없다고 알리면 어떤 프로젝트가 존재하는지가 새어
     * 나간다(PRJ-002 A2).
     */
    @Transactional(readOnly = true)
    public Project find(UUID projectId, UUID ownerId) {
        return projectRepository
                .findById(projectId)
                .filter(project -> project.isOwnedBy(ownerId))
                .orElseThrow(TrackerErrorCode.PROJECT_NOT_FOUND::raise);
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    @Override
    @Transactional
    public UUID create(UUID ownerId, String name) {
        Instant now = clock.instant();
        ProjectName projectName = ProjectName.of(name);
        Project project = Project.create(UUID.randomUUID(), ownerId, projectName, freeKey(ownerId, projectName), now);
        projectRepository.save(project);
        return project.id();
    }

    @Transactional
    public void rename(UUID ownerId, UUID projectId, String name) {
        Project project = find(projectId, ownerId);
        project.rename(ProjectName.of(name), clock.instant());
        projectRepository.save(project);
    }

    // --- 내부 --------------------------------------------------------------------------------------------------------
    /**
     * 겹치지 않는 접두어를 낸다.
     *
     * <p>되묻지 않고 뒤에 숫자를 붙이는 것은 접두어가 사용자가 고른 것이 아니라 이름에서 뽑은 것이기
     * 때문이다(PRJ-001 A2). 접두어는 사용자 안에서만 유일하므로 그 사람의 것만 본다.
     */
    private ProjectKey freeKey(UUID ownerId, ProjectName name) {
        Set<String> taken = projectRepository.findKeysOwnedBy(ownerId).stream()
                .map(ProjectKey::value)
                .collect(Collectors.toSet());
        ProjectKey candidate = ProjectKey.from(name);
        if (!taken.contains(candidate.value())) {
            return candidate;
        }
        for (int suffix = 2; suffix < KEY_ATTEMPTS; suffix++) {
            ProjectKey next = candidate.withSuffix(suffix);
            if (!taken.contains(next.value())) {
                return next;
            }
        }
        throw new IllegalStateException("겹치지 않는 프로젝트 접두어를 뽑지 못했다");
    }
}
