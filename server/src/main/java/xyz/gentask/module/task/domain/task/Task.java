package xyz.gentask.module.task.domain.task;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Task {

    @NonNull private final UUID id;

    @NonNull private final UUID userId;

    @NonNull private TaskTitle title;

    @NonNull private TaskNote note;

    private LocalDate dueDate;

    private LocalDateTime remindAt;

    private boolean important;

    private LocalDate myDayOn;

    private Instant completedAt;

    @NonNull private final Instant createdAt;

    @NonNull private Instant updatedAt;

    public static Task create(UUID id, UUID userId, TaskTitle title, Instant now) {
        return new Task(id, userId, title, TaskNote.empty(), null, null, false, null, null, now, now);
    }

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

    public boolean isOwnedBy(@NonNull UUID candidateUserId) {
        return userId.equals(candidateUserId);
    }

    public boolean isCompleted() {
        return completedAt != null;
    }

    public void complete(Instant now) {
        if (isCompleted()) {
            return;
        }
        this.completedAt = now;
        this.updatedAt = now;
    }

    public void cancelCompletion(Instant now) {
        if (!isCompleted()) {
            return;
        }
        this.completedAt = null;
        this.updatedAt = now;
    }

    public void changeTitle(@NonNull TaskTitle title, Instant now) {
        this.title = title;
        this.updatedAt = now;
    }

    public void changeNote(@NonNull TaskNote note, Instant now) {
        this.note = note;
        this.updatedAt = now;
    }

    public void changeDueDate(LocalDate dueDate, Instant now) {
        this.dueDate = dueDate;
        this.updatedAt = now;
    }

    public void changeRemindAt(LocalDateTime remindAt, Instant now) {
        this.remindAt = remindAt;
        this.updatedAt = now;
    }

    public void markImportant(Instant now) {
        this.important = true;
        this.updatedAt = now;
    }

    public void clearImportant(Instant now) {
        this.important = false;
        this.updatedAt = now;
    }

    public void addToMyDay(@NonNull LocalDate today, Instant now) {
        this.myDayOn = today;
        this.updatedAt = now;
    }

    public void removeFromMyDay(Instant now) {
        this.myDayOn = null;
        this.updatedAt = now;
    }
}
