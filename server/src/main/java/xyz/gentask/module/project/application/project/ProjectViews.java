package xyz.gentask.module.project.application.project;

import io.swagger.v3.oas.annotations.media.Schema;

public final class ProjectViews {

    private ProjectViews() {}

    @Schema(name = "ProjectView")
    public record ProjectView(
            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    description = "프로젝트 NanoID",
                    minLength = 12,
                    maxLength = 12,
                    pattern = "[0-9A-Za-z_-]{12}")
            String id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String name,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED, description = "작업 아이템 이름의 접두어")
            String key,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int taskCount,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String role) {}
}
