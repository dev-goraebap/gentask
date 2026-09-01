package xyz.gentask.module.tracker.infrastructure;

import static xyz.gentask.jooq.Tables.ISSUES;
import static xyz.gentask.jooq.Tables.PROJECTS;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.IssuesRecord;
import xyz.gentask.module.tracker.application.issue.IssueQuery;
import xyz.gentask.module.tracker.application.issue.IssueViews.AcceptanceCriterionView;
import xyz.gentask.module.tracker.application.issue.IssueViews.IssueSummary;
import xyz.gentask.module.tracker.application.issue.IssueViews.IssueView;
import xyz.gentask.module.tracker.domain.issue.AcceptanceCriterion;
import xyz.gentask.module.tracker.domain.issue.IssueBody;
import xyz.gentask.module.tracker.domain.issue.IssueKind;
import xyz.gentask.module.tracker.domain.issue.IssueState;

/**
 * 목록과 상세를 낸다.
 *
 * <p>파생값을 저장하지 않으므로 여기서 만든다. 자식 수는 한 프로젝트의 항목을 다 실어 와 세고, 인수
 * 조건 수는 본문을 세어 낸다. 목록 질의가 본문을 싣는 것이 그 대가이며, 항목이 수천이 되면 그때 다시
 * 본다.
 */
@Repository
@RequiredArgsConstructor
class JooqIssueQuery implements IssueQuery {

    private final DSLContext dslContext;

    @Override
    public List<IssueSummary> findAll(UUID projectId) {
        String key = keyOf(projectId);
        List<IssuesRecord> records = dslContext
                .selectFrom(ISSUES)
                .where(ISSUES.PROJECT_ID.eq(projectId))
                .orderBy(ISSUES.ORDINAL.asc())
                .fetch();

        Map<UUID, Integer> numbers = new HashMap<>();
        Map<UUID, Integer> childCounts = new HashMap<>();
        Map<UUID, Integer> closedChildCounts = new HashMap<>();
        for (IssuesRecord each : records) {
            numbers.put(each.getId(), each.getNumber());
            if (each.getParentId() == null) {
                continue;
            }
            childCounts.merge(each.getParentId(), 1, Integer::sum);
            if (IssueState.valueOf(each.getState()).isSettled()) {
                closedChildCounts.merge(each.getParentId(), 1, Integer::sum);
            }
        }

        List<IssueSummary> summaries = new ArrayList<>(records.size());
        for (IssuesRecord each : records) {
            summaries.add(toSummary(each, key, numbers, childCounts, closedChildCounts));
        }
        return List.copyOf(summaries);
    }

    @Override
    public Optional<IssueView> findOne(UUID projectId, int number) {
        return dslContext
                .selectFrom(ISSUES)
                .where(ISSUES.PROJECT_ID.eq(projectId))
                .and(ISSUES.NUMBER.eq(number))
                .fetchOptional()
                .map(record -> toView(record, projectId));
    }

    // --- 내부 --------------------------------------------------------------------------------------------------------
    private String keyOf(UUID projectId) {
        return dslContext
                .select(PROJECTS.KEY)
                .from(PROJECTS)
                .where(PROJECTS.ID.eq(projectId))
                .fetchOptional(PROJECTS.KEY)
                .orElseThrow(() -> new IllegalStateException("프로젝트 없이 작업 아이템을 낼 수 없다"));
    }

    private IssueView toView(IssuesRecord issuesRecord, UUID projectId) {
        List<AcceptanceCriterion> criteria = AcceptanceCriterion.readFrom(IssueBody.of(issuesRecord.getBody()));

        // 상세는 하나만 내므로 부모의 번호와 자식 수를 그 자리에서 따로 센다.
        Map<UUID, Integer> numbers = new HashMap<>();
        if (issuesRecord.getParentId() != null) {
            dslContext
                    .select(ISSUES.ID, ISSUES.NUMBER)
                    .from(ISSUES)
                    .where(ISSUES.ID.eq(issuesRecord.getParentId()))
                    .forEach(parent -> numbers.put(parent.value1(), parent.value2()));
        }
        Map<UUID, Integer> childCounts = Map.of(issuesRecord.getId(), countChildren(issuesRecord.getId(), false));
        Map<UUID, Integer> closedChildCounts = Map.of(issuesRecord.getId(), countChildren(issuesRecord.getId(), true));

        return new IssueView(
                toSummary(issuesRecord, keyOf(projectId), numbers, childCounts, closedChildCounts),
                issuesRecord.getBody(),
                criteria.stream().map(JooqIssueQuery::toCriterionView).toList(),
                issuesRecord.getCreatedAt());
    }

    private int countChildren(UUID parentId, boolean settledOnly) {
        var condition = ISSUES.PARENT_ID.eq(parentId);
        if (settledOnly) {
            condition = condition.and(ISSUES.STATE.in(IssueState.COMPLETED.name(), IssueState.CANCELED.name()));
        }
        return dslContext.fetchCount(ISSUES, condition);
    }

    private static IssueSummary toSummary(
            IssuesRecord issuesRecord,
            String projectKey,
            Map<UUID, Integer> numbers,
            Map<UUID, Integer> childCounts,
            Map<UUID, Integer> closedChildCounts) {
        List<AcceptanceCriterion> criteria = AcceptanceCriterion.readFrom(IssueBody.of(issuesRecord.getBody()));
        Integer parentNumber = issuesRecord.getParentId() == null ? null : numbers.get(issuesRecord.getParentId());

        return new IssueSummary(
                issuesRecord.getId(),
                keyOf(projectKey, issuesRecord.getNumber()),
                issuesRecord.getNumber(),
                IssueKind.valueOf(issuesRecord.getKind()),
                IssueState.valueOf(issuesRecord.getState()),
                issuesRecord.getTitle(),
                parentNumber == null ? null : keyOf(projectKey, parentNumber),
                issuesRecord.getDueDate(),
                issuesRecord.getClosedAt(),
                childCounts.getOrDefault(issuesRecord.getId(), 0),
                closedChildCounts.getOrDefault(issuesRecord.getId(), 0),
                AcceptanceCriterion.count(criteria),
                AcceptanceCriterion.unverifiedCount(criteria));
    }

    /** 사람이 부르는 이름. 자릿수는 백로그 도구가 쓰던 것과 같다. */
    private static String keyOf(String projectKey, int number) {
        return "%s-%03d".formatted(projectKey, number);
    }

    private static AcceptanceCriterionView toCriterionView(AcceptanceCriterion criterion) {
        return new AcceptanceCriterionView(
                criterion.number(), criterion.sentence(), criterion.verified(), criterion.retired());
    }
}
