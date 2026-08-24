package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.module.task.application.TaskViews.TaskView;
import dev.goraebap.refarch.module.task.domain.Task;
import dev.goraebap.refarch.module.task.domain.TaskNote;
import dev.goraebap.refarch.module.task.domain.TaskRepository;
import dev.goraebap.refarch.module.task.domain.TaskTitle;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** TK-001 ~ TK-004. 모든 경로가 로그인한 사용자의 것만 다룬다 (TK-005). */
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskQuery taskQuery;
    private final Clock clock;

    /**
     * TK-001 기본 흐름과 A2.
     *
     * 기한을 붙이는 것은 목록에 넣기 전이므로 저장은 한 번이다. 같은 시각을 넘겨 만든 시각과
     * 고친 시각이 갈리지 않게 한다.
     */
    @Transactional
    public UUID add(UUID userId, String title, LocalDate dueDate) {
        Instant now = clock.instant();
        Task task = Task.create(UUID.randomUUID(), userId, TaskTitle.of(title), now);
        task.changeDueDate(dueDate, now);
        taskRepository.save(task);
        return task.id();
    }

    /** TK-003 기본 흐름 · A2 · A3 · A10. */
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

    /** TK-004 기본 흐름과 A2. */
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

    /** TK-003 A4. */
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

    /** TK-003 A5. 담는 날짜를 여기서 정한다. 시계를 주입받는 자리가 시간대 정책을 갖는다. */
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

    /** TK-003 A6. 되돌릴 수 없음을 확인받는 것은 화면의 일이다. */
    @Transactional
    public void remove(UUID userId, UUID taskId) {
        find(taskId, userId);
        taskRepository.deleteById(taskId);
    }

    @Transactional(readOnly = true)
    public List<TaskView> list(UUID userId) {
        return taskQuery.findAll(userId);
    }

    @Transactional(readOnly = true)
    public TaskView detail(UUID userId, UUID taskId) {
        return taskQuery.findOne(taskId, userId).orElseThrow(TaskErrorCode.TASK_NOT_FOUND::raise);
    }

    /**
     * 없는 것을 고치려 한 경우다. TK-003 A8 · TK-004 A3.
     *
     * 남의 작업도 같은 답을 받는다. 갈라 말하면 남의 식별자가 실재하는지가 응답으로 새어 나간다.
     */
    Task find(UUID taskId, UUID userId) {
        return taskRepository
                .findById(taskId)
                .filter(task -> task.isOwnedBy(userId))
                .orElseThrow(TaskErrorCode.TASK_NOT_FOUND::raise);
    }
}
