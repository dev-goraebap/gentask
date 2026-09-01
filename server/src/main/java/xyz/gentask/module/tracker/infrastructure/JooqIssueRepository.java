package xyz.gentask.module.tracker.infrastructure;

import static xyz.gentask.jooq.Tables.ISSUES;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.IssuesRecord;
import xyz.gentask.module.tracker.domain.issue.Issue;
import xyz.gentask.module.tracker.domain.issue.IssueBody;
import xyz.gentask.module.tracker.domain.issue.IssueKind;
import xyz.gentask.module.tracker.domain.issue.IssueRepository;
import xyz.gentask.module.tracker.domain.issue.IssueState;
import xyz.gentask.module.tracker.domain.issue.IssueTitle;

@Repository
@RequiredArgsConstructor
class JooqIssueRepository implements IssueRepository {

    private final DSLContext dslContext;

    @Override
    public void save(Issue issue) {
        dslContext
                .insertInto(ISSUES)
                .set(ISSUES.ID, issue.id())
                .set(ISSUES.PROJECT_ID, issue.projectId())
                .set(ISSUES.NUMBER, issue.number())
                .set(ISSUES.KIND, issue.kind().name())
                .set(ISSUES.STATE, issue.state().name())
                .set(ISSUES.TITLE, issue.title().value())
                .set(ISSUES.BODY, issue.body().value())
                .set(ISSUES.PARENT_ID, issue.parentId())
                .set(ISSUES.ORDINAL, issue.ordinal())
                .set(ISSUES.AUTHOR_ID, issue.authorId())
                .set(ISSUES.DUE_DATE, issue.dueDate())
                .set(ISSUES.CLOSED_AT, issue.closedAt())
                .set(ISSUES.CREATED_AT, issue.createdAt())
                .set(ISSUES.UPDATED_AT, issue.updatedAt())
                .onConflict(ISSUES.ID)
                .doUpdate()
                .set(ISSUES.KIND, issue.kind().name())
                .set(ISSUES.STATE, issue.state().name())
                .set(ISSUES.TITLE, issue.title().value())
                .set(ISSUES.BODY, issue.body().value())
                .set(ISSUES.PARENT_ID, issue.parentId())
                .set(ISSUES.ORDINAL, issue.ordinal())
                .set(ISSUES.DUE_DATE, issue.dueDate())
                .set(ISSUES.CLOSED_AT, issue.closedAt())
                .set(ISSUES.UPDATED_AT, issue.updatedAt())
                .execute();
    }

    @Override
    public Optional<Issue> findById(UUID issueId) {
        return dslContext
                .selectFrom(ISSUES)
                .where(ISSUES.ID.eq(issueId))
                .fetchOptional()
                .map(JooqIssueRepository::toDomain);
    }

    @Override
    public Optional<Issue> findByNumber(UUID projectId, int number) {
        return dslContext
                .selectFrom(ISSUES)
                .where(ISSUES.PROJECT_ID.eq(projectId))
                .and(ISSUES.NUMBER.eq(number))
                .fetchOptional()
                .map(JooqIssueRepository::toDomain);
    }

    @Override
    public void deleteById(UUID issueId) {
        dslContext.deleteFrom(ISSUES).where(ISSUES.ID.eq(issueId)).execute();
    }

    private static Issue toDomain(IssuesRecord issuesRecord) {
        return Issue.restore(
                issuesRecord.getId(),
                issuesRecord.getProjectId(),
                issuesRecord.getNumber(),
                IssueKind.valueOf(issuesRecord.getKind()),
                IssueState.valueOf(issuesRecord.getState()),
                IssueTitle.of(issuesRecord.getTitle()),
                IssueBody.of(issuesRecord.getBody()),
                issuesRecord.getParentId(),
                issuesRecord.getOrdinal(),
                issuesRecord.getAuthorId(),
                issuesRecord.getDueDate(),
                issuesRecord.getClosedAt(),
                issuesRecord.getCreatedAt(),
                issuesRecord.getUpdatedAt());
    }
}
