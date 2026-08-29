package dev.goraebap.refarch.module.task.application.file;

import dev.goraebap.refarch.module.file.AttachmentSlot;
import dev.goraebap.refarch.module.file.AttachmentView;
import dev.goraebap.refarch.module.file.Attachments;
import dev.goraebap.refarch.module.task.application.file.TaskFileViews.TaskFileView;
import dev.goraebap.refarch.module.task.application.task.TaskService;
import dev.goraebap.refarch.shared.storage.PresignedUpload;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 작업에 붙는 파일. 보관과 정책은 file 모듈이 갖고 여기는 그 앞에서 작업 소유를 판정한다.
 *
 * <p>file 을 부르기 전에 {@code taskService.find} 가 그 작업이 이 사용자의 것인지 확인한다. file 은
 * 접근 판정을 되풀이하지 않으므로 이 호출을 빠뜨리면 남의 작업에 파일이 붙는다.
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
    @Transactional
    public PresignedUpload presign(UUID userId, UUID taskId, String fileName, String contentType, long size) {
        taskService.find(taskId, userId);
        return attachments.presign(SLOT, taskId, fileName, contentType, size);
    }

    /**
     * 이름과 형식은 발급 때 받아 둔 것을 쓰므로 이 요청의 값을 보지 않는다. 두 요청이 같은 파일을
     * 가리키는 한 값이 같고, 다르면 발급 시점의 검사를 통과한 쪽이 맞다. 인자는 API 계약이라 남긴다.
     */
    @Transactional
    public TaskFileView attach(UUID userId, UUID taskId, String objectKey, String fileName, String contentType) {
        taskService.find(taskId, userId);
        return toView(attachments.attach(SLOT, taskId, objectKey));
    }

    @Transactional
    public void detach(UUID userId, UUID taskId, UUID taskFileId) {
        taskService.find(taskId, userId);
        attachments.detach(SLOT, taskId, taskFileId);
    }

    /** 작업이 사라지면 붙은 파일도 함께 걷는다. 다형 연결이라 표가 대신 지워 주지 않는다. */
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
