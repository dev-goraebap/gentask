package dev.goraebap.refarch.module.task.application.file;

import dev.goraebap.refarch.module.task.application.TaskErrorCode;
import dev.goraebap.refarch.module.task.application.file.TaskFileViews.TaskFileView;
import dev.goraebap.refarch.module.task.application.task.TaskService;
import dev.goraebap.refarch.module.task.domain.file.TaskFile;
import dev.goraebap.refarch.module.task.domain.file.TaskFileRepository;
import dev.goraebap.refarch.shared.storage.ObjectStorage;
import dev.goraebap.refarch.shared.storage.PresignedUpload;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** TK-003 A11. 소유 확인은 TaskService.find 를 지나므로 남의 작업에는 어떤 조작도 닿지 않는다. */
@Service
@RequiredArgsConstructor
public class TaskFileService {

    /** 작업당 개수 상한. */
    static final int MAX_FILES = 5;

    /** 파일 하나의 크기 상한. */
    static final long MAX_FILE_BYTES = 10L * 1024 * 1024;

    /** 올리기 창. 이 안에 PUT 이 끝나야 한다. */
    private static final Duration UPLOAD_EXPIRY = Duration.ofMinutes(10);

    /** 내려받기 주소의 수명. */
    private static final Duration DOWNLOAD_EXPIRY = Duration.ofMinutes(10);

    private final TaskService taskService;
    private final TaskFileRepository taskFileRepository;
    private final ObjectStorage objectStorage;
    private final Clock clock;

    /** 검증에 걸리면 URL 을 내주지 않아 올리기 자체가 시작되지 않는다. */
    @Transactional(readOnly = true)
    public PresignedUpload presign(UUID userId, UUID taskId, String fileName, String contentType, long size) {
        taskService.find(taskId, userId);
        if (taskFileRepository.countByTaskId(taskId) >= MAX_FILES) {
            throw TaskErrorCode.TASK_FILE_LIMIT_EXCEEDED.raise();
        }
        if (size > MAX_FILE_BYTES) {
            throw TaskErrorCode.TASK_FILE_TOO_LARGE.raise();
        }
        String objectKey = "tasks/" + taskId + "/" + UUID.randomUUID();
        return new PresignedUpload(objectKey, objectStorage.presignPut(objectKey, contentType, UPLOAD_EXPIRY));
    }

    /**
     * 붙임의 확정. 크기는 클라이언트 말이 아니라 보관소의 실측을 믿는다.
     *
     * 키가 그 작업의 자리(tasks/{id}/) 밖이면 받지 않는다. presign 을 거치지 않은 키로
     * 남의 오브젝트를 붙이는 것을 막는다.
     */
    @Transactional
    public TaskFileView attach(UUID userId, UUID taskId, String objectKey, String fileName, String contentType) {
        taskService.find(taskId, userId);
        if (taskFileRepository.countByTaskId(taskId) >= MAX_FILES) {
            throw TaskErrorCode.TASK_FILE_LIMIT_EXCEEDED.raise();
        }
        if (!objectKey.startsWith("tasks/" + taskId + "/")) {
            throw TaskErrorCode.TASK_FILE_NOT_UPLOADED.raise();
        }
        long actualSize = objectStorage.sizeOf(objectKey).orElseThrow(TaskErrorCode.TASK_FILE_NOT_UPLOADED::raise);
        if (actualSize > MAX_FILE_BYTES) {
            objectStorage.delete(objectKey);
            throw TaskErrorCode.TASK_FILE_TOO_LARGE.raise();
        }

        TaskFile taskFile = TaskFile.attach(
                UUID.randomUUID(), taskId, fileName, contentType, actualSize, objectKey, clock.instant());
        taskFileRepository.save(taskFile);
        return toView(taskFile);
    }

    @Transactional(readOnly = true)
    public List<TaskFileView> list(UUID userId, UUID taskId) {
        taskService.find(taskId, userId);
        return taskFileRepository.findByTaskId(taskId).stream()
                .map(this::toView)
                .toList();
    }

    /** 떼면 보관소의 바이트도 함께 지운다. 되살리는 수단은 없다 (TK-003 A11). */
    @Transactional
    public void detach(UUID userId, UUID taskId, UUID taskFileId) {
        taskService.find(taskId, userId);
        TaskFile taskFile = taskFileRepository
                .findById(taskFileId)
                .filter(found -> found.taskId().equals(taskId))
                .orElseThrow(TaskErrorCode.TASK_FILE_NOT_FOUND::raise);
        taskFileRepository.deleteById(taskFile.id());
        objectStorage.delete(taskFile.objectKey());
    }

    private TaskFileView toView(TaskFile taskFile) {
        return new TaskFileView(
                taskFile.id(),
                taskFile.fileName(),
                taskFile.contentType(),
                taskFile.fileSize(),
                objectStorage.presignGet(taskFile.objectKey(), taskFile.fileName(), DOWNLOAD_EXPIRY),
                taskFile.createdAt());
    }
}
