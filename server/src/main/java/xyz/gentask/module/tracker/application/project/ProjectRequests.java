package xyz.gentask.module.tracker.application.project;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import xyz.gentask.module.tracker.domain.project.ProjectKey;
import xyz.gentask.module.tracker.domain.project.ProjectName;

public final class ProjectRequests {

    private ProjectRequests() {}

    /** 접두어는 사람이 정한다. 이름에서 뽑지 않으므로 세울 때 함께 받는다. */
    public record CreateProject(
            @NotBlank(message = ProjectName.REQUIRED) @Size(max = ProjectName.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String name,

            @NotBlank(message = ProjectKey.REQUIRED) @Size(max = ProjectKey.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String key) {}

    /** 넘긴 것만 바꾼다. 비어 있으면 그 자리는 손대지 않는다. */
    public record EditProject(
            @Size(max = ProjectName.MAX) String name,
            @Size(max = ProjectKey.MAX) String key) {}
}
