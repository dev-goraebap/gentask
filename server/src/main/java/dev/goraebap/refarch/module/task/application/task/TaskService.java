package dev.goraebap.refarch.module.task.application.task;

import dev.goraebap.refarch.module.file.AttachmentSlot;
import dev.goraebap.refarch.module.file.Attachments;
import dev.goraebap.refarch.module.task.application.TaskErrorCode;
import dev.goraebap.refarch.module.task.application.task.TaskViews.TaskView;
import dev.goraebap.refarch.module.task.domain.task.Task;
import dev.goraebap.refarch.module.task.domain.task.TaskNote;
import dev.goraebap.refarch.module.task.domain.task.TaskRepository;
import dev.goraebap.refarch.module.task.domain.task.TaskTitle;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskService {

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final TaskRepository taskRepository;
    private final TaskQuery taskQuery;
    private final Attachments attachments;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<TaskView> list(UUID userId) {
        return taskQuery.findAll(userId);
    }

    @Transactional(readOnly = true)
    public TaskView detail(UUID userId, UUID taskId) {
        return taskQuery.findOne(taskId, userId).orElseThrow(TaskErrorCode.TASK_NOT_FOUND::raise);
    }

    @Transactional(readOnly = true)
    public Task find(UUID taskId, UUID userId) {
        return taskRepository
                .findById(taskId)
                .filter(task -> task.isOwnedBy(userId))
                .orElseThrow(TaskErrorCode.TASK_NOT_FOUND::raise);
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    @Transactional
    public UUID add(UUID userId, String title, LocalDate dueDate) {
        Instant now = clock.instant();
        Task task = Task.create(UUID.randomUUID(), userId, TaskTitle.of(title), now);
        task.changeDueDate(dueDate, now);
        taskRepository.save(task);
        return task.id();
    }

    @Transactional
    public void edit(UUID userId, UUID taskId, String title, String note, LocalDate dueDate, LocalDateTime remindAt) {
        Task task = find(taskId, userId);
        Instant now = clock.instant();
        task.changeTitle(TaskTitle.of(title), now);
        task.changeNote(TaskNote.of(note), now);
        task.changeDueDate(dueDate, now);
        task.changeRemindAt(remindAt, now);
        taskRepository.save(task);
    }

    @Transactional
    public void changeCompletion(UUID userId, UUID taskId, boolean completed) {
        Task task = find(taskId, userId);
        Instant now = clock.instant();
        if (completed) {
            task.complete(now);
        } else {
            task.cancelCompletion(now);
        }
        taskRepository.save(task);
    }

    @Transactional
    public void changeImportance(UUID userId, UUID taskId, boolean important) {
        Task task = find(taskId, userId);
        Instant now = clock.instant();
        if (important) {
            task.markImportant(now);
        } else {
            task.clearImportant(now);
        }
        taskRepository.save(task);
    }

    @Transactional
    public void changeMyDay(UUID userId, UUID taskId, boolean inMyDay) {
        Task task = find(taskId, userId);
        Instant now = clock.instant();
        if (inMyDay) {
            task.addToMyDay(LocalDate.now(clock), now);
        } else {
            task.removeFromMyDay(now);
        }
        taskRepository.save(task);
    }

    @Transactional
    public void remove(UUID userId, UUID taskId) {
        find(taskId, userId);
        // 첨부는 다형 연결이라 외래 키가 없다. 작업을 지울 때 함께 걷지 않으면 보관소에 남는다
        attachments.detachAll(AttachmentSlot.TASK_FILES, taskId);
        taskRepository.deleteById(taskId);
    }
}
