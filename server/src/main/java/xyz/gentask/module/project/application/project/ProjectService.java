package xyz.gentask.module.project.application.project;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.project.ProjectAccessIn;
import xyz.gentask.module.project.ProjectCreationIn;
import xyz.gentask.module.project.application.ProjectErrorCode;
import xyz.gentask.module.project.application.project.ProjectViews.ProjectView;
import xyz.gentask.module.project.domain.project.Project;
import xyz.gentask.module.project.domain.project.ProjectKey;
import xyz.gentask.module.project.domain.project.ProjectName;
import xyz.gentask.module.project.domain.project.ProjectRepository;
import xyz.gentask.shared.domain.NanoId;

@Service
@RequiredArgsConstructor
public class ProjectService implements ProjectCreationIn, ProjectAccessIn {

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final ProjectRepository projectRepository;
    private final ProjectQuery projectQuery;
    private final Clock clock;
    private final xyz.gentask.module.project.application.member.MemberStore members;

    // --- 조회 --------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<ProjectView> list(UUID ownerId) {
        return projectQuery.findAll(ownerId);
    }

    @Transactional(readOnly = true)
    public ProjectView detail(UUID ownerId, String projectId) {
        return projectQuery.findOne(ownerId, readId(projectId)).orElseThrow(ProjectErrorCode.PROJECT_NOT_FOUND::raise);
    }

    /** 현재 접근 정책은 소유자에게만 허용한다. 멤버 권한 도입 시 이 구현에서 판정한다. */
    @Override
    @Transactional(readOnly = true)
    public String requireAccess(UUID userId, String projectId) {
        members.role(userId, readId(projectId)).orElseThrow(ProjectErrorCode.PROJECT_NOT_FOUND::raise);
        return projectId;
    }

    @Override
    @Transactional
    public String requireWrite(UUID userId, String projectId) {
        members.lockProject(projectId);
        String role = members.role(userId, readId(projectId)).orElseThrow(ProjectErrorCode.PROJECT_NOT_FOUND::raise);
        if ("viewer".equals(role)) throw ProjectErrorCode.MEMBER_FORBIDDEN.raise();
        return projectId;
    }

    private Project find(UUID ownerId, String projectId) {
        return projectRepository
                .findById(ownerId, readId(projectId))
                .orElseThrow(ProjectErrorCode.PROJECT_NOT_FOUND::raise);
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    /**
     * 프로젝트를 세우고 주소가 담을 식별자를 낸다.
     *
     * 접두어는 사람이 받아 넘긴다. 이름에서 뽑던 규칙과 겹칠 때 숫자를 붙이던 자리는 함께 걷었다 —
     * 접두어가 주소에 쓰이지 않게 되어 유일할 이유가 없어졌다.
     */
    @Override
    @Transactional
    public String create(UUID ownerId, String name, String key) {
        Instant now = clock.instant();
        Project project = NanoId.create(
                id -> Project.create(id, ownerId, ProjectName.of(name), ProjectKey.of(key), now),
                projectRepository::insert);
        return project.id();
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
     * 모양이 맞지 않는 것을 잘못된 요청이 아니라 없는 자리로 낸다. 주소에 담긴 값이라 사람이 손으로
     * 고치거나 옛 링크를 따라온 것이며, 그때 보아야 하는 것은 400 이 아니라 없다는 말이다.
     */
    private static String readId(String rawId) {
        try {
            return NanoId.requireValid(rawId);
        } catch (IllegalArgumentException ignored) {
            throw ProjectErrorCode.PROJECT_NOT_FOUND.raise();
        }
    }
}
