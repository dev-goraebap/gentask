package xyz.gentask.module.tracker.application.issue;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import xyz.gentask.module.tracker.domain.issue.IssueBody;
import xyz.gentask.module.tracker.domain.issue.IssueKind;
import xyz.gentask.module.tracker.domain.issue.IssueState;
import xyz.gentask.module.tracker.domain.issue.IssueTitle;

public final class IssueRequests {

    private IssueRequests() {}

    public record CreateIssue(
            @NotBlank(message = IssueTitle.REQUIRED) @Size(max = IssueTitle.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @Schema(description = "고르지 않으면 TASK 다") IssueKind kind,

            @Size(max = IssueBody.MAX) String body) {}

    public record ChangeState(
            @NotNull @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            IssueState state) {}
}
