package dev.goraebap.refarch.module.task.infrastructure;

import static dev.goraebap.refarch.jooq.Tables.TASK_FILES;

import dev.goraebap.refarch.jooq.tables.records.TaskFilesRecord;
import dev.goraebap.refarch.module.task.domain.TaskFile;
import dev.goraebap.refarch.module.task.domain.TaskFileRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class JooqTaskFileRepository implements TaskFileRepository {

    private final DSLContext dslContext;

    /** 붙인 파일은 불변이라 갱신 분기가 없다. */
    @Override
    public void save(TaskFile taskFile) {
        dslContext
                .insertInto(TASK_FILES)
                .set(TASK_FILES.ID, taskFile.id())
                .set(TASK_FILES.TASK_ID, taskFile.taskId())
                .set(TASK_FILES.FILE_NAME, taskFile.fileName())
                .set(TASK_FILES.CONTENT_TYPE, taskFile.contentType())
                .set(TASK_FILES.FILE_SIZE, taskFile.fileSize())
                .set(TASK_FILES.OBJECT_KEY, taskFile.objectKey())
                .set(TASK_FILES.CREATED_AT, taskFile.createdAt())
                .execute();
    }

    @Override
    public List<TaskFile> findByTaskId(UUID taskId) {
        return dslContext
                .selectFrom(TASK_FILES)
                .where(TASK_FILES.TASK_ID.eq(taskId))
                .orderBy(TASK_FILES.CREATED_AT.asc())
                .fetch(JooqTaskFileRepository::toDomain);
    }

    @Override
    public Optional<TaskFile> findById(UUID taskFileId) {
        return dslContext
                .selectFrom(TASK_FILES)
                .where(TASK_FILES.ID.eq(taskFileId))
                .fetchOptional()
                .map(JooqTaskFileRepository::toDomain);
    }

    @Override
    public int countByTaskId(UUID taskId) {
        return dslContext.fetchCount(TASK_FILES, TASK_FILES.TASK_ID.eq(taskId));
    }

    @Override
    public void deleteById(UUID taskFileId) {
        dslContext.deleteFrom(TASK_FILES).where(TASK_FILES.ID.eq(taskFileId)).execute();
    }

    private static TaskFile toDomain(TaskFilesRecord taskFilesRecord) {
        return TaskFile.restore(
                taskFilesRecord.getId(),
                taskFilesRecord.getTaskId(),
                taskFilesRecord.getFileName(),
                taskFilesRecord.getContentType(),
                taskFilesRecord.getFileSize(),
                taskFilesRecord.getObjectKey(),
                taskFilesRecord.getCreatedAt());
    }
}
