package xyz.gentask.module.issue.application.issue;

import java.time.Instant;

public interface IssueNumberSequence {
    int next(String projectId, Instant now);
}
