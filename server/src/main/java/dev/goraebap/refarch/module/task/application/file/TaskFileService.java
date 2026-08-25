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

@Service
@RequiredArgsConstructor
public class TaskFileService {

    // --- 상수 --------------------------------------------------------------------------------------------------------
    static final int MAX_FILES = 5;

    static final long MAX_FILE_BYTES = 10L * 1024 * 1024;

    private static final Duration UPLOAD_EXPIRY = Duration.ofMinutes(10);

    private static final Duration DOWNLOAD_EXPIRY = Duration.ofMinutes(10);

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final TaskService taskService;
    private final TaskFileRepository taskFileRepository;
    private final ObjectStorage objectStorage;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------
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

    @Transactional(readOnly = true)
    public List<TaskFileView> list(UUID userId, UUID taskId) {
        taskService.find(taskId, userId);
        return taskFileRepository.findByTaskId(taskId).stream()
                .map(this::toView)
                .toList();
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
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

    // --- 보조 --------------------------------------------------------------------------------------------------------
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
