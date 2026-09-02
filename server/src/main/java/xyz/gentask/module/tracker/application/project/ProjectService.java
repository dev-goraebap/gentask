package xyz.gentask.module.tracker.application.project;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.tracker.Projects;
import xyz.gentask.module.tracker.application.TrackerErrorCode;
import xyz.gentask.module.tracker.application.project.ProjectViews.ProjectView;
import xyz.gentask.module.tracker.domain.project.Project;
import xyz.gentask.module.tracker.domain.project.ProjectKey;
import xyz.gentask.module.tracker.domain.project.ProjectName;
import xyz.gentask.module.tracker.domain.project.ProjectPublicId;
import xyz.gentask.module.tracker.domain.project.ProjectRepository;
import xyz.gentask.shared.error.DomainRuleViolation;

@Service
@RequiredArgsConstructor
public class ProjectService implements Projects {

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
    public ProjectView detail(UUID ownerId, String projectId) {
        return projectQuery
                .findOne(ownerId, readPublicId(projectId).value())
                .orElseThrow(TrackerErrorCode.PROJECT_NOT_FOUND::raise);
    }

    /**
     * 주소의 식별자로 프로젝트를 낸다.
     *
     * <p>식별자가 전역으로 유일하므로 그것만으로 하나가 가려지나 소유자를 함께 본다. 있으나 권한이
     * 없다고 알리면 어떤 프로젝트가 존재하는지가 새어 나간다(PRJ-002 A2).
     */
    @Transactional(readOnly = true)
    public Project find(UUID ownerId, String projectId) {
        return projectRepository
                .findByPublicId(ownerId, readPublicId(projectId))
                .orElseThrow(TrackerErrorCode.PROJECT_NOT_FOUND::raise);
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    /**
     * 프로젝트를 세우고 주소가 담을 식별자를 낸다.
     *
     * <p>접두어는 사람이 받아 넘긴다. 이름에서 뽑던 규칙과 겹칠 때 숫자를 붙이던 자리는 함께 걷었다 —
     * 접두어가 주소에 쓰이지 않게 되어 유일할 이유가 없어졌다.
     */
    @Override
    @Transactional
    public String create(UUID ownerId, String name, String key) {
        Instant now = clock.instant();
        Project project = Project.create(
                UUID.randomUUID(), ProjectPublicId.generate(), ownerId, ProjectName.of(name), ProjectKey.of(key), now);
        projectRepository.save(project);
        return project.publicId().value();
    }

    /** 넘긴 것만 바꾼다. 번호는 접두어를 따라 바뀌지 않는다. */
    @Transactional
    public void edit(UUID ownerId, String projectId, String name, String key) {
        Project project = find(ownerId, projectId);
        Instant now = clock.instant();

        if (name != null && !name.isBlank()) {
            project.rename(ProjectName.of(name), now);
        }
        if (key != null && !key.isBlank()) {
            project.changeKey(ProjectKey.of(key), now);
        }
        projectRepository.save(project);
    }

    // --- 내부 --------------------------------------------------------------------------------------------------------
    /**
     * 주소에서 받은 식별자를 읽는다.
     *
     * <p>모양이 맞지 않는 것을 잘못된 요청이 아니라 없는 자리로 낸다. 주소에 담긴 값이라 사람이 손으로
     * 고치거나 옛 링크를 따라온 것이며, 그때 보아야 하는 것은 400 이 아니라 없다는 말이다.
     */
    private static ProjectPublicId readPublicId(String rawId) {
        try {
            return ProjectPublicId.of(rawId);
        } catch (DomainRuleViolation ignored) {
            throw TrackerErrorCode.PROJECT_NOT_FOUND.raise();
        }
    }
}
