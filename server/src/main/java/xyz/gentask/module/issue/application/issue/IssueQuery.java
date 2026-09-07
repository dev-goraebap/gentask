package xyz.gentask.module.issue.application.issue;

import java.util.List;
import java.util.Optional;
import xyz.gentask.module.issue.application.issue.IssueViews.IssueSummary;
import xyz.gentask.module.issue.application.issue.IssueViews.IssueView;

public interface IssueQuery {

    List<IssueSummary> findAll(String projectId);

    Optional<IssueView> findOne(String projectId, int number);
}
