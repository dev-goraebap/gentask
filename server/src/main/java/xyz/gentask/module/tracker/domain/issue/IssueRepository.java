package xyz.gentask.module.tracker.domain.issue;

import java.util.Optional;
import java.util.UUID;

public interface IssueRepository {

    void save(Issue issue);

    Optional<Issue> findById(UUID issueId);

    /** 프로젝트 식별자와 일련번호 조합으로 작업 항목을 조회한다. */
    Optional<Issue> findByNumber(UUID projectId, int number);

    void deleteById(UUID issueId);
}
