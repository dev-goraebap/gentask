package dev.goraebap.refarch.module.task.application.task;

import dev.goraebap.refarch.module.task.domain.task.TaskNote;
import dev.goraebap.refarch.module.task.domain.task.TaskTitle;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class TaskRequests {

    private TaskRequests() {}

    /** 기한은 붙이지 않을 수 있고 지난 날짜여도 받는다. TK-001 A2 가 제약을 두지 않는다. */
    public record CreateTask(
            @NotBlank(message = TaskTitle.REQUIRED) @Size(max = TaskTitle.MAX) String title,

            @Schema(
                    types = {"string", "null"},
                    format = "date")
            LocalDate dueDate) {}

    /**
     * 사용자가 상세에서 고칠 수 있는 넷이다. TK-003 기본 흐름 · A2 · A3 · A10.
     *
     * 넷을 항상 함께 보낸다. 빠진 필드와 뗀 필드를 구분하지 않으므로 null 은 언제나 "뗀다"
     * 이며, 부분 전송을 허용하면 그 둘이 같은 모양이 되어 고치지 않은 값이 지워진다.
     *
     * 완료 · 중요 · 나의 하루는 여기 없다. 각자 하위 자원을 가지며, 같은 값을 두 경로로
     * 바꾸면 어느 쪽이 이겼는지 알 수 없다.
     */
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

    /** TK-004. */
    public record ChangeCompletion(
            @NotNull @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Boolean completed) {}

    /** TK-003 A4. */
    public record ChangeImportance(
            @NotNull @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Boolean important) {}

    /** TK-003 A5. 담는 날짜는 서버가 정한다. 화면마다 오늘을 계산하면 자정을 넘긴 화면이 다른 날짜를 쓴다. */
    public record ChangeMyDay(
            @NotNull @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Boolean inMyDay) {}
}
