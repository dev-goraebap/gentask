package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.module.task.domain.TaskTitle;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class TaskRequests {

    private TaskRequests() {}

    public record CreateTask(
            @NotBlank(message = TaskTitle.REQUIRED) @Size(max = TaskTitle.MAX) String title) {}
}
