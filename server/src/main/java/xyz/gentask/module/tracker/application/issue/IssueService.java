package xyz.gentask.module.tracker.application.issue;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.tracker.application.TrackerErrorCode;
import xyz.gentask.module.tracker.application.issue.IssueViews.IssueSummary;
import xyz.gentask.module.tracker.application.issue.IssueViews.IssueView;
import xyz.gentask.module.tracker.application.project.ProjectService;
import xyz.gentask.module.tracker.domain.issue.Issue;
import xyz.gentask.module.tracker.domain.issue.IssueBody;
import xyz.gentask.module.tracker.domain.issue.IssueKind;
import xyz.gentask.module.tracker.domain.issue.IssueRepository;
import xyz.gentask.module.tracker.domain.issue.IssueState;
import xyz.gentask.module.tracker.domain.issue.IssueTitle;
import xyz.gentask.module.tracker.domain.project.Project;
import xyz.gentask.module.tracker.domain.project.ProjectRepository;

@Service
@RequiredArgsConstructor
public class IssueService {

    /** 손으로 고친 순서를 나중에 끼워 넣을 수 있게 띄엄띄엄 매긴다. */
    private static final int ORDINAL_STEP = 1_000;

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final IssueRepository issueRepository;
    private final IssueQuery issueQuery;
    private final ProjectRepository projectRepository;
    private final ProjectService projectService;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<IssueSummary> list(UUID userId, String projectId) {
        return issueQuery.findAll(projectService.find(userId, projectId).id());
    }

    /**
     * 번호 하나를 낸다.
     *
     * 번호는 프로젝트 안에서만 유일하다. 지금 프로젝트에 그 번호가 없으면 다른 프로젝트에 있더라도
     * 없는 것이다(ITM-002 A5).
     */
    @Transactional(readOnly = true)
    public IssueView detail(UUID userId, String projectId, int number) {
        Project project = projectService.find(userId, projectId);
        return issueQuery.findOne(project.id(), number).orElseThrow(TrackerErrorCode.ISSUE_NOT_FOUND::raise);
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    @Transactional
    public int add(UUID userId, String projectId, String title, IssueKind kind, String body, String parentKey) {
        Project project = projectService.find(userId, projectId);
        Instant now = clock.instant();
        int number = project.issueNumber(now);
        projectRepository.save(project);

        Issue issue = Issue.create(
                UUID.randomUUID(),
                project.id(),
                number,
                kind == null ? IssueKind.DEFAULT : kind,
                IssueTitle.of(title),
                IssueBody.of(body),
                userId,
                number * ORDINAL_STEP,
                now);
        issue.changeParent(parentOf(project, parentKey), now);
        issueRepository.save(issue);
        return number;
    }

    /**
     * 제목 · 유형 · 본문을 고친다.
     *
     * 번호는 손대지 않는다. 유형을 바꿔도 옮길 표가 없으므로 번호가 따라 바뀔 이유가 없다
     * (ITM-004 A3).
     */
    @Transactional
    public void edit(
            UUID userId, String projectId, int number, String title, IssueKind kind, String body, String parentKey) {
        Project project = projectService.find(userId, projectId);
        Issue issue =
                issueRepository.findByNumber(project.id(), number).orElseThrow(TrackerErrorCode.ISSUE_NOT_FOUND::raise);

        Instant now = clock.instant();
        issue.changeTitle(IssueTitle.of(title), now);
        issue.changeKind(kind, now);
        issue.changeBody(IssueBody.of(body), now);
        issue.changeParent(parentOf(project, parentKey), now);
        issueRepository.save(issue);
    }

    /**
     * 상위 작업 항목 키로부터 해당 작업의 고유 식별자(UUID)를 조회한다.
     */
    private UUID parentOf(Project project, String parentKey) {
        if (parentKey == null || parentKey.isBlank()) {
            return null;
        }
        int number = numberOf(parentKey);
        return issueRepository
                .findByNumber(project.id(), number)
                .map(Issue::id)
                .orElseThrow(TrackerErrorCode.ISSUE_NOT_FOUND::raise);
    }

    /** 작업 항목 키(예: GT-43)에서 일련번호를 파싱한다. */
    private static int numberOf(String key) {
        try {
            return Integer.parseInt(key.substring(key.lastIndexOf('-') + 1));
        } catch (NumberFormatException ignored) {
            throw TrackerErrorCode.ISSUE_NOT_FOUND.raise();
        }
    }

    /**
     * 작업 항목을 삭제한다. 하위 작업은 삭제되지 않고 최상위 계층으로 승격된다(ITM-005 A2).
     * 발급된 일련번호는 재사용되지 않는다(GT-43 #5).
     */
    @Transactional
    public void remove(UUID userId, String projectId, int number) {
        issueRepository.deleteById(find(userId, projectId, number).id());
    }

    @Transactional
    public void changeState(UUID userId, String projectId, int number, IssueState state) {
        Issue issue = find(userId, projectId, number);
        issue.changeState(state, clock.instant());
        issueRepository.save(issue);
    }

    // --- 내부 --------------------------------------------------------------------------------------------------------
    private Issue find(UUID userId, String projectId, int number) {
        Project project = projectService.find(userId, projectId);
        return issueRepository.findByNumber(project.id(), number).orElseThrow(TrackerErrorCode.ISSUE_NOT_FOUND::raise);
    }
}
