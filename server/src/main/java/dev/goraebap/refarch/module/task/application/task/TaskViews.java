package dev.goraebap.refarch.module.task.application.task;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public final class TaskViews {

    private TaskViews() {}

    static final String LOCAL_DATE_TIME = "yyyy-MM-dd'T'HH:mm";

    @Schema(name = "TaskView")
    public record TaskView(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            UUID id,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String title,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
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
            @JsonFormat(pattern = LOCAL_DATE_TIME)
            LocalDateTime remindAt,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            boolean important,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "date")
            LocalDate myDayOn,

            @Schema(
                    requiredMode = Schema.RequiredMode.REQUIRED,
                    types = {"string", "null"},
                    format = "date-time")
            Instant completedAt,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            Instant createdAt) {}
}
