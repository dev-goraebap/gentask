package dev.goraebap.refarch.module.task.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/** 작업 애그리거트 (TK-001 ~ TK-004). */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Task {

    // 식별자
    @NonNull private final UUID id;

    // 제목
    @NonNull private TaskTitle title;

    // 메모
    @NonNull private TaskNote note;

    // 기한
    private LocalDate dueDate;

    // 미리 알림 시각
    private LocalDateTime remindAt;

    // 중요 표시
    private boolean important;

    // 나의 하루에 담은 날짜
    private LocalDate myDayOn;

    // 완료 시각
    private Instant completedAt;

    // 만든 시각
    @NonNull private final Instant createdAt;

    // 고친 시각
    @NonNull private Instant updatedAt;

    /** 제목 외의 값은 정해지지 않은 상태로 시작한다. TK-001 기본 흐름. */
    public static Task create(UUID id, TaskTitle title, Instant now) {
        return new Task(id, title, TaskNote.empty(), null, null, false, null, null, now, now);
    }

    /** 저장소만 호출한다. 검증을 지나지 않는다. */
    public static Task restore(
            UUID id,
            TaskTitle title,
            TaskNote note,
            LocalDate dueDate,
            LocalDateTime remindAt,
            boolean important,
            LocalDate myDayOn,
            Instant completedAt,
            Instant createdAt,
            Instant updatedAt) {
        return new Task(id, title, note, dueDate, remindAt, important, myDayOn, completedAt, createdAt, updatedAt);
    }

    public boolean isCompleted() {
        return completedAt != null;
    }
}
