package xyz.gentask.module.tracker.domain.issue;

import java.util.Optional;
import java.util.UUID;

public interface IssueRepository {

    void save(Issue issue);

    Optional<Issue> findById(UUID issueId);

    /** 번호는 프로젝트 안에서만 유일하므로 둘을 함께 받는다. */
    Optional<Issue> findByNumber(UUID projectId, int number);

    void deleteById(UUID issueId);
}
