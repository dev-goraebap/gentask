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

            @Size(max = IssueBody.MAX) String body,

            @Schema(
                    description = "부모의 이름(TG-041). 없으면 최상위다",
                    types = {"string", "null"})
            String parentKey) {}

    /**
     * 고치는 것은 제목 · 유형 · 본문 셋이다.
     *
     * <p>번호는 불변이고 상태는 제 자리(ITM-003)가 갖는다. 인수 조건은 본문 안의 체크 항목이므로
     * 본문을 담는 것이 곧 인수 조건을 담는 것이다.
     */
    public record EditIssue(
            @NotBlank(message = IssueTitle.REQUIRED) @Size(max = IssueTitle.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @NotNull @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            IssueKind kind,

            @Size(max = IssueBody.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String body,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    description = "부모의 이름(TG-041). 비우면 최상위가 된다",
                    types = {"string", "null"})
            String parentKey) {}

    public record ChangeState(
            @NotNull @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            IssueState state) {}
}
