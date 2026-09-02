package xyz.gentask.module.tracker.application.project;

import io.swagger.v3.oas.annotations.media.Schema;

public final class ProjectViews {

    private ProjectViews() {}

    @Schema(name = "ProjectView")
    public record ProjectView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "주소가 담는 식별자")
            String id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String name,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "작업 아이템 이름의 접두어")
            String key,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int issueCount) {}
}
