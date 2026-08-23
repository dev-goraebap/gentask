package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.module.task.domain.TaskTitle;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public final class TaskRequests {

    private TaskRequests() {}

    /** 기한은 붙이지 않을 수 있고 지난 날짜여도 받는다. TK-001 A2 가 제약을 두지 않는다. */
    public record CreateTask(
            @NotBlank(message = TaskTitle.REQUIRED) @Size(max = TaskTitle.MAX) String title,

            LocalDate dueDate) {}
}
