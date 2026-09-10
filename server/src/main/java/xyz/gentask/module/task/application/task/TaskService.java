package xyz.gentask.module.task.application.task;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.file.AttachmentSlot;
import xyz.gentask.module.file.Attachments;
import xyz.gentask.module.task.application.TaskErrorCode;
import xyz.gentask.module.task.application.task.TaskViews.TaskView;
import xyz.gentask.module.task.domain.task.Task;
import xyz.gentask.module.task.domain.task.TaskNote;
import xyz.gentask.module.task.domain.task.TaskRepository;
import xyz.gentask.module.task.domain.task.TaskTitle;

@Service
@RequiredArgsConstructor
public class TaskService {

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final TaskRepository taskRepository;
    private final TaskQuery taskQuery;
    private final Attachments attachments;
    private final Clock clock;
    private final xyz.gentask.module.project.ProjectAccessIn projects;
    private final xyz.gentask.module.artifact.ArtifactReferenceIn artifacts;
    private final TaskLinkStore links;
    private final TaskNoteLinkStore noteLinks;
    private final xyz.gentask.module.note.NoteReferenceIn notes;

    @Transactional(readOnly = true)
    public List<xyz.gentask.module.note.NoteReferenceIn.Reference> linkedNotes(UUID userId, UUID taskId) {
        var task = find(taskId, userId);
        return notes.references(userId, task.projectId(), noteLinks.list(taskId));
    }

    @Transactional
    public void linkNote(UUID userId, UUID taskId, String noteId) {
        var task = findForWrite(taskId, userId);
        if (notes.references(userId, task.projectId(), List.of(noteId)).isEmpty())
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "연결 가능한 메모를 찾을 수 없습니다.");
        noteLinks.add(taskId, noteId);
    }

    @Transactional
    public void unlinkNote(UUID userId, UUID taskId, String noteId) {
        findForWrite(taskId, userId);
        noteLinks.remove(taskId, noteId);
    }

    // --- 조회 --------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<TaskView> list(UUID userId) {
        return taskQuery.findAll(userId);
    }

    @Transactional(readOnly = true)
    public List<TaskView> list(UUID userId, String projectId, String scope) {
        return list(userId, projectId, scope, TaskDateFilter.all());
    }

    @Transactional(readOnly = true)
    public List<TaskView> list(UUID userId, String projectId, String scope, TaskDateFilter dates) {
        var filter = xyz.gentask.shared.domain.ResourceFilter.of(projectId, scope);
        if (projectId != null) {
            projects.requireAccess(userId, projectId);
            return taskQuery.findProject(projectId, dates);
        }
        return taskQuery.findVisible(userId, filter.personal(), dates);
    }

    @Transactional(readOnly = true)
    public TaskView detail(UUID userId, UUID taskId) {
        return taskQuery.findOne(taskId, userId).orElseThrow(TaskErrorCode.TASK_NOT_FOUND::raise);
    }

    @Transactional(readOnly = true)
    public Task find(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId).orElseThrow(TaskErrorCode.TASK_NOT_FOUND::raise);
        if (task.projectId() == null) {
            if (!task.isOwnedBy(userId)) throw TaskErrorCode.TASK_NOT_FOUND.raise();
        } else projects.requireAccess(userId, task.projectId());
        return task;
    }

    @Transactional
    public Task findForWrite(UUID taskId, UUID userId) {
        Task found = find(taskId, userId);
        if (found.projectId() != null) projects.requireWrite(userId, found.projectId());
        return taskRepository.findByIdForUpdate(taskId).orElseThrow(TaskErrorCode.TASK_NOT_FOUND::raise);
    }

    @Transactional(readOnly = true)
    public List<TaskView> listProject(UUID userId, String projectId) {
        projects.requireAccess(userId, projectId);
        return taskQuery.findProject(projectId);
    }

    @Transactional
    public UUID addProject(UUID userId, String projectId, String title, LocalDate dueDate) {
        projects.requireWrite(userId, projectId);
        Task task = Task.create(UUID.randomUUID(), userId, TaskTitle.of(title), clock.instant());
        task.restoreScope(projectId, null, xyz.gentask.module.task.domain.task.TaskState.TODO);
        task.changeDueDate(dueDate, clock.instant());
        taskRepository.save(task);
        return task.id();
    }

    @Transactional
    public UUID create(UUID userId, TaskRequests.CreateScopedTask input) {
        if (input.projectId() != null) projects.requireWrite(userId, input.projectId());
        if (input.assigneeId() != null) {
            if (input.projectId() == null) throw TaskErrorCode.PROJECT_TASK_REQUIRED.raise();
            projects.requireAccess(input.assigneeId(), input.projectId());
        }
        Instant now = clock.instant();
        Task task = Task.create(UUID.randomUUID(), userId, TaskTitle.of(input.title()), now);
        task.restoreScope(input.projectId(), input.assigneeId(), xyz.gentask.module.task.domain.task.TaskState.TODO);
        task.changeNote(TaskNote.of(input.note()), now);
        task.changeSchedule(input.scheduledDate(), input.dueDate(), now);
        task.changeState(
                input.state() == null ? xyz.gentask.module.task.domain.task.TaskState.TODO : input.state(), now);
        taskRepository.save(task);
        return task.id();
    }

    @Transactional
    public void schedule(UUID userId, UUID taskId, LocalDate scheduledDate, LocalDate dueDate) {
        Task task = findForWrite(taskId, userId);
        task.changeSchedule(scheduledDate, dueDate, clock.instant());
        taskRepository.save(task);
    }

    @Transactional
    public void changeState(UUID userId, UUID taskId, String state) {
        Task task = findForWrite(taskId, userId);
        task.changeState(xyz.gentask.module.task.domain.task.TaskState.valueOf(state), clock.instant());
        taskRepository.save(task);
    }

    @Transactional
    public void assign(UUID userId, UUID taskId, UUID assigneeId) {
        Task task = findForWrite(taskId, userId);
        if (task.projectId() == null) throw TaskErrorCode.PROJECT_TASK_REQUIRED.raise();
        if (assigneeId != null) projects.requireAccess(assigneeId, task.projectId());
        task.assign(assigneeId, clock.instant());
        taskRepository.save(task);
    }

    @Transactional(readOnly = true)
    public List<TaskLinkStore.LinkedArtifact> linkedArtifacts(UUID userId, UUID taskId) {
        find(taskId, userId);
        return links.list(taskId);
    }

    @Transactional
    public void linkArtifact(UUID userId, UUID taskId, String artifactId) {
        Task task = findForWrite(taskId, userId);
        artifacts.requireReference(userId, task.projectId(), artifactId);
        links.add(taskId, artifactId);
    }

    @Transactional
    public void unlinkArtifact(UUID userId, UUID taskId, String artifactId) {
        findForWrite(taskId, userId);
        links.remove(taskId, artifactId);
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
        Task task = findForWrite(taskId, userId);
        Instant now = clock.instant();
        task.changeTitle(TaskTitle.of(title), now);
        task.changeNote(TaskNote.of(note), now);
        task.changeDueDate(dueDate, now);
        if (task.projectId() != null && remindAt != null) throw TaskErrorCode.PERSONAL_SETTING_ONLY.raise();
        task.changeRemindAt(remindAt, now);
        taskRepository.save(task);
    }

    @Transactional
    public void changeCompletion(UUID userId, UUID taskId, boolean completed) {
        Task task = findForWrite(taskId, userId);
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
        Task task = findForWrite(taskId, userId);
        Instant now = clock.instant();
        if (task.projectId() != null) throw TaskErrorCode.PERSONAL_SETTING_ONLY.raise();
        if (important) {
            task.markImportant(now);
        } else {
            task.clearImportant(now);
        }
        taskRepository.save(task);
    }

    @Transactional
    public void changeMyDay(UUID userId, UUID taskId, boolean inMyDay) {
        Task task = findForWrite(taskId, userId);
        Instant now = clock.instant();
        if (task.projectId() != null) throw TaskErrorCode.PERSONAL_SETTING_ONLY.raise();
        if (inMyDay) {
            task.addToMyDay(LocalDate.now(clock), now);
        } else {
            task.removeFromMyDay(now);
        }
        taskRepository.save(task);
    }

    @Transactional
    public void remove(UUID userId, UUID taskId) {
        findForWrite(taskId, userId);
        // 다형 첨부 구조에 따라 작업 삭제 시 연관된 첨부 파일도 함께 삭제한다.
        attachments.detachAll(AttachmentSlot.TASK_FILES, taskId);
        taskRepository.deleteById(taskId);
    }
}
