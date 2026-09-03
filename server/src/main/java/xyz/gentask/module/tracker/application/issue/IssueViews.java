package xyz.gentask.module.tracker.application.issue;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import xyz.gentask.module.tracker.domain.issue.IssueKind;
import xyz.gentask.module.tracker.domain.issue.IssueState;

public final class IssueViews {

    private IssueViews() {}

    /**
     * 목록의 한 줄.
     *
     * 본문을 담지 않는다. 다만 인수 조건 수는 본문을 세어 내므로 질의는 본문을 실어 온다. 항목이
     * 수천이 되면 그때 다시 본다.
     */
    @Schema(name = "IssueSummary")
    public record IssueSummary(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            UUID id,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    description = "사람이 부르는 이름. 접두어와 번호다",
                    example = "GT-30")
            String key,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int number,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            IssueKind kind,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            IssueState state,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"})
            String parentKey,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "date")
            LocalDate dueDate,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "date-time")
            Instant closedAt,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int childCount,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int closedChildCount,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int criteriaCount,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int unverifiedCount) {}

    @Schema(name = "AcceptanceCriterionView")
    public record AcceptanceCriterionView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int number,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String sentence,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            boolean verified,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "결번인가")
            boolean retired) {}

    @Schema(name = "IssueView")
    public record IssueView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            IssueSummary summary,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "마크다운. 인수 조건이 이 안에 있다")
            String body,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            List<AcceptanceCriterionView> criteria,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "세운 사람의 별명")
            String authorName,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Instant createdAt) {

        /** 받은 목록을 그대로 들고 있지 않는다. 밖에서 고치면 이미 만든 응답이 함께 바뀐다. */
        public IssueView {
            criteria = List.copyOf(criteria);
        }
    }
}
