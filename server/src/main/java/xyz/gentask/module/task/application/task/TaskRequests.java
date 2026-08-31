package xyz.gentask.module.task.application.task;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import xyz.gentask.module.task.domain.task.TaskNote;
import xyz.gentask.module.task.domain.task.TaskTitle;

public final class TaskRequests {

    private TaskRequests() {}

    public record CreateTask(
            @NotBlank(message = TaskTitle.REQUIRED) @Size(max = TaskTitle.MAX) String title,

            @Schema(
                    types = {"string", "null"},
                    format = "date")
            LocalDate dueDate) {}

    public record EditTask(
            @NotBlank(message = TaskTitle.REQUIRED) @Size(max = TaskTitle.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @Size(max = TaskNote.MAX) @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String note,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "date")
            LocalDate dueDate,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "date-time",
                    example = "2026-08-30T09:00")
            LocalDateTime remindAt) {}

    public record ChangeCompletion(
            @NotNull @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Boolean completed) {}

    public record ChangeImportance(
            @NotNull @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Boolean important) {}

    public record ChangeMyDay(
            @NotNull @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Boolean inMyDay) {}
}
