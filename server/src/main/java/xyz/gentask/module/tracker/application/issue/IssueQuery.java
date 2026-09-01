package xyz.gentask.module.tracker.application.issue;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import xyz.gentask.module.tracker.application.issue.IssueViews.IssueSummary;
import xyz.gentask.module.tracker.application.issue.IssueViews.IssueView;

public interface IssueQuery {

    List<IssueSummary> findAll(UUID projectId);

    Optional<IssueView> findOne(UUID projectId, int number);
}
