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

    // 소유자. 작업은 계정 단위로 격리된다 (TK-005)
    @NonNull private final UUID userId;

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
    public static Task create(UUID id, UUID userId, TaskTitle title, Instant now) {
        return new Task(id, userId, title, TaskNote.empty(), null, null, false, null, null, now, now);
    }

    /** 저장소만 호출한다. 검증을 지나지 않는다. */
    public static Task restore(
            UUID id,
            UUID userId,
            TaskTitle title,
            TaskNote note,
            LocalDate dueDate,
            LocalDateTime remindAt,
            boolean important,
            LocalDate myDayOn,
            Instant completedAt,
            Instant createdAt,
            Instant updatedAt) {
        return new Task(
                id, userId, title, note, dueDate, remindAt, important, myDayOn, completedAt, createdAt, updatedAt);
    }

    /** 이 계정의 것인지다. 남의 작업은 없는 작업과 같은 답을 받는다 (TK-003 A8). */
    public boolean isOwnedBy(@NonNull UUID candidateUserId) {
        return userId.equals(candidateUserId);
    }

    public boolean isCompleted() {
        return completedAt != null;
    }

    /**
     * 완료 상태로 바꾼다. TK-004 기본 흐름.
     *
     * 이미 완료된 것은 건드리지 않는다. TK-004 A1 이 그것을 실패가 아니라 별도 성공 출구로
     * 두므로, 처음 완료한 시각이 두 번째 호출로 밀리면 안 된다.
     */
    public void complete(Instant now) {
        if (isCompleted()) {
            return;
        }
        this.completedAt = now;
        this.updatedAt = now;
    }

    /** 완료를 취소한다. TK-004 A2. */
    public void cancelCompletion(Instant now) {
        if (!isCompleted()) {
            return;
        }
        this.completedAt = null;
        this.updatedAt = now;
    }

    /** TK-003 기본 흐름. */
    public void changeTitle(@NonNull TaskTitle title, Instant now) {
        this.title = title;
        this.updatedAt = now;
    }

    /** TK-003 A2. */
    public void changeNote(@NonNull TaskNote note, Instant now) {
        this.note = note;
        this.updatedAt = now;
    }

    /** 기한을 정하거나 뗀다. null 이 떼는 쪽이다. TK-001 A2 · TK-003 A3. */
    public void changeDueDate(LocalDate dueDate, Instant now) {
        this.dueDate = dueDate;
        this.updatedAt = now;
    }

    /**
     * 미리 알림을 정하거나 뗀다. null 이 떼는 쪽이다. TK-001 A3 · TK-003 A10.
     *
     * 기한과 서로를 정하지 않으므로 둘을 함께 검증하지 않는다. 기한만 있는 작업과 미리
     * 알림만 있는 작업이 모두 성립한다.
     */
    public void changeRemindAt(LocalDateTime remindAt, Instant now) {
        this.remindAt = remindAt;
        this.updatedAt = now;
    }

    /** TK-001 A7 · TK-003 A4. */
    public void markImportant(Instant now) {
        this.important = true;
        this.updatedAt = now;
    }

    public void clearImportant(Instant now) {
        this.important = false;
        this.updatedAt = now;
    }

    /**
     * 나의 하루에 담는다. TK-001 A7 · TK-003 A5.
     *
     * 담은 날짜를 인자로 받는 이유는 도메인이 시간대를 모르기 때문이다. Instant 에서 날짜를
     * 뽑으려면 어느 지역의 하루인지를 정해야 하고, 그 정책은 시계를 주입받는 쪽에 있다.
     */
    public void addToMyDay(@NonNull LocalDate today, Instant now) {
        this.myDayOn = today;
        this.updatedAt = now;
    }

    public void removeFromMyDay(Instant now) {
        this.myDayOn = null;
        this.updatedAt = now;
    }
}
