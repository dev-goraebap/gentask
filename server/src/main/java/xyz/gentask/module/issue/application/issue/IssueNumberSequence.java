package xyz.gentask.module.issue.application.issue;

import java.time.Instant;
import java.util.UUID;

public interface IssueNumberSequence {
    int next(UUID projectId, Instant now);
}
