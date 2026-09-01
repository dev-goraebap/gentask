package xyz.gentask.module.tracker.application.project;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import xyz.gentask.module.tracker.domain.project.ProjectName;

public final class ProjectRequests {

    private ProjectRequests() {}

    public record CreateProject(
            @NotBlank(message = ProjectName.REQUIRED) @Size(max = ProjectName.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String name) {}

    public record RenameProject(
            @NotBlank(message = ProjectName.REQUIRED) @Size(max = ProjectName.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String name) {}
}
