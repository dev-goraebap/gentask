package dev.goraebap.refarch.module.task.application;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public final class TaskViews {

    private TaskViews() {}

    /** 미리 알림은 사용자가 고른 "그 날 그 시각" 이라 시간대를 붙이지 않는다. */
    public record TaskView(
            UUID id,
            String title,
            String note,
            LocalDate dueDate,
            LocalDateTime remindAt,
            boolean important,
            LocalDate myDayOn,
            Instant completedAt,
            Instant createdAt) {}
}
