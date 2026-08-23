package dev.goraebap.refarch.module.task.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * 작업 애그리거트 (TK-001 ~ TK-004).
 *
 * <p>완료를 boolean 이 아니라 시각으로 둔다. <b>"언제 해냈는가" 가 완료 목록의 정렬 근거</b>이고,
 * boolean 으로 두면 그 정보를 나중에 되살릴 수 없다.
 *
 * <p>나의 하루에 담긴 것도 날짜다. 담긴 것은 매일 비워져야 하는데, 날짜를 들고 있으면 오늘과
 * 비교하는 것만으로 비워지므로 자정에 값을 지우러 다니는 장치를 두지 않아도 된다.
 */
public final class Task {

    private final UUID id;
    private TaskTitle title;
    private TaskNote note;
    private LocalDate dueDate;
    private LocalDateTime remindAt;
    private boolean important;
    private LocalDate myDayOn;
    private Instant completedAt;
    private final Instant createdAt;
    private Instant updatedAt;

    private Task(
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
        this.id = Objects.requireNonNull(id);
        this.title = Objects.requireNonNull(title);
        this.note = Objects.requireNonNull(note);
        this.dueDate = dueDate;
        this.remindAt = remindAt;
        this.important = important;
        this.myDayOn = myDayOn;
        this.completedAt = completedAt;
        this.createdAt = Objects.requireNonNull(createdAt);
        this.updatedAt = Objects.requireNonNull(updatedAt);
    }

    /** 새 작업. 제목만으로 만들어지며 나머지는 정해지지 않은 상태로 시작한다. TK-001 기본 흐름. */
    public static Task create(UUID id, TaskTitle title, Instant now) {
        return new Task(id, title, TaskNote.empty(), null, null, false, null, null, now, now);
    }

    /**
     * 저장소 전용 재구성.
     *
     * <p>생성 경로와 나누는 이유는 이미 저장된 값이 현재 불변식을 통과하지 못할 수 있기
     * 때문이다. 규칙이 강화된 뒤에도 옛 데이터는 읽혀야 한다.
     */
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

    public UUID id() {
        return id;
    }

    public TaskTitle title() {
        return title;
    }

    public TaskNote note() {
        return note;
    }

    public LocalDate dueDate() {
        return dueDate;
    }

    public LocalDateTime remindAt() {
        return remindAt;
    }

    public boolean important() {
        return important;
    }

    public LocalDate myDayOn() {
        return myDayOn;
    }

    public Instant completedAt() {
        return completedAt;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }
}
