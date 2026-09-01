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
import xyz.gentask.shared.error.DomainRuleViolation;

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
    public ProjectView detail(UUID ownerId, String key) {
        return projectQuery
                .findOne(ownerId, readKey(key).value())
                .orElseThrow(TrackerErrorCode.PROJECT_NOT_FOUND::raise);
    }

    /**
     * 접두어로 프로젝트를 낸다.
     *
     * <p>주소가 UUID 가 아니라 접두어를 갖는다. 사람이 읽고 공유할 수 있어야 하며, 접두어는 소유자
     * 안에서만 유일하고 주소는 로그인한 사람의 것이라 그것으로 충분하다.
     *
     * <p>남의 것은 애초에 걸리지 않는다. 있으나 권한이 없다고 알리면 어떤 프로젝트가 존재하는지가
     * 새어 나간다(PRJ-002 A2).
     */
    @Transactional(readOnly = true)
    public Project find(UUID ownerId, String key) {
        return projectRepository
                .findByKey(ownerId, readKey(key))
                .orElseThrow(TrackerErrorCode.PROJECT_NOT_FOUND::raise);
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    @Override
    @Transactional
    public String create(UUID ownerId, String name) {
        Instant now = clock.instant();
        ProjectName projectName = ProjectName.of(name);
        Project project = Project.create(UUID.randomUUID(), ownerId, projectName, freeKey(ownerId, projectName), now);
        projectRepository.save(project);
        return project.key().value();
    }

    /**
     * 주소에서 받은 접두어를 읽는다.
     *
     * <p>모양이 맞지 않는 것을 잘못된 요청이 아니라 없는 자리로 낸다. 주소에 담긴 값이라 사람이 손으로
     * 고치거나 옛 링크를 따라온 것이며, 그때 보아야 하는 것은 400 이 아니라 없다는 말이다.
     */
    private static ProjectKey readKey(String rawKey) {
        try {
            return ProjectKey.of(rawKey);
        } catch (DomainRuleViolation ignored) {
            throw TrackerErrorCode.PROJECT_NOT_FOUND.raise();
        }
    }

    @Transactional
    public void rename(UUID ownerId, String key, String name) {
        Project project = find(ownerId, key);
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
