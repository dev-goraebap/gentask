package dev.goraebap.refarch.module.file.infrastructure;

import static dev.goraebap.refarch.jooq.Tables.PENDING_UPLOADS;

import dev.goraebap.refarch.jooq.tables.records.PendingUploadsRecord;
import dev.goraebap.refarch.module.file.domain.pending.PendingUpload;
import dev.goraebap.refarch.module.file.domain.pending.PendingUploadRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class JooqPendingUploadRepository implements PendingUploadRepository {

    private final DSLContext dslContext;

    @Override
    public void save(PendingUpload pendingUpload) {
        dslContext
                .insertInto(PENDING_UPLOADS)
                .set(PENDING_UPLOADS.ID, pendingUpload.id())
                .set(PENDING_UPLOADS.STORAGE_KEY, pendingUpload.storageKey())
                .set(PENDING_UPLOADS.OWNER_TYPE, pendingUpload.ownerType())
                .set(PENDING_UPLOADS.OWNER_ID, pendingUpload.ownerId())
                .set(PENDING_UPLOADS.NAME, pendingUpload.name())
                .set(PENDING_UPLOADS.FILE_NAME, pendingUpload.fileName())
                .set(PENDING_UPLOADS.CONTENT_TYPE, pendingUpload.contentType())
                .set(PENDING_UPLOADS.CREATED_AT, pendingUpload.createdAt())
                .execute();
    }

    @Override
    public Optional<PendingUpload> findByStorageKey(String storageKey) {
        return dslContext
                .selectFrom(PENDING_UPLOADS)
                .where(PENDING_UPLOADS.STORAGE_KEY.eq(storageKey))
                .fetchOptional()
                .map(JooqPendingUploadRepository::toDomain);
    }

    @Override
    public void deleteById(UUID pendingUploadId) {
        dslContext
                .deleteFrom(PENDING_UPLOADS)
                .where(PENDING_UPLOADS.ID.eq(pendingUploadId))
                .execute();
    }

    private static PendingUpload toDomain(PendingUploadsRecord pendingUploadsRecord) {
        return PendingUpload.restore(
                pendingUploadsRecord.getId(),
                pendingUploadsRecord.getStorageKey(),
                pendingUploadsRecord.getOwnerType(),
                pendingUploadsRecord.getOwnerId(),
                pendingUploadsRecord.getName(),
                pendingUploadsRecord.getFileName(),
                pendingUploadsRecord.getContentType(),
                pendingUploadsRecord.getCreatedAt());
    }
}
