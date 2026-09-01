package xyz.gentask.module.tracker.application.project;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.UUID;

public final class ProjectViews {

    private ProjectViews() {}

    @Schema(name = "ProjectView")
    public record ProjectView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            UUID id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String name,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "작업 아이템 번호의 접두어")
            String key,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int issueCount) {}
}
