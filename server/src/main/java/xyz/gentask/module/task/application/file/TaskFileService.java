package xyz.gentask.module.task.application.file;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.file.AttachmentSlot;
import xyz.gentask.module.file.AttachmentView;
import xyz.gentask.module.file.Attachments;
import xyz.gentask.module.task.application.file.TaskFileViews.TaskFileView;
import xyz.gentask.module.task.application.task.TaskService;

/**
 * 작업 첨부 파일 연결 및 작업 소유권 검증 서비스다.
 */
@Service
@RequiredArgsConstructor
public class TaskFileService {

    private static final AttachmentSlot SLOT = AttachmentSlot.TASK_FILES;

    private final TaskService taskService;
    private final Attachments attachments;

    // --- 조회 --------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<TaskFileView> list(UUID userId, UUID taskId) {
        taskService.find(taskId, userId);
        return attachments.list(SLOT, taskId).stream()
                .map(TaskFileService::toView)
                .toList();
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------

    /**
     * 발급 시점에 검증된 메타데이터를 기반으로 작업에 파일을 첨부한다.
     */
    @Transactional
    public TaskFileView attach(UUID userId, UUID taskId, String objectKey, String fileName, String contentType) {
        taskService.find(taskId, userId);
        return toView(attachments.attach(SLOT, taskId, userId, objectKey));
    }

    @Transactional
    public void detach(UUID userId, UUID taskId, UUID taskFileId) {
        taskService.find(taskId, userId);
        attachments.detach(SLOT, taskId, taskFileId);
    }

    /** 작업 삭제 시 연관된 모든 첨부 파일을 함께 삭제한다. */
    @Transactional
    public void detachAll(UUID taskId) {
        attachments.detachAll(SLOT, taskId);
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------
    private static TaskFileView toView(AttachmentView attachment) {
        return new TaskFileView(
                attachment.id(),
                attachment.fileName(),
                attachment.contentType(),
                attachment.size(),
                attachment.url(),
                attachment.createdAt());
    }
}
