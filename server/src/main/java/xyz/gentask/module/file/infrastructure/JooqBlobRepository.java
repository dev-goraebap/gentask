package xyz.gentask.module.file.infrastructure;

import static xyz.gentask.jooq.Tables.BLOBS;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.BlobsRecord;
import xyz.gentask.module.file.domain.blob.Blob;
import xyz.gentask.module.file.domain.blob.BlobRepository;

@Repository
@RequiredArgsConstructor
class JooqBlobRepository implements BlobRepository {

    private final DSLContext dslContext;

    @Override
    public void save(Blob blob) {
        dslContext
                .insertInto(BLOBS)
                .set(BLOBS.ID, blob.id())
                .set(BLOBS.STORAGE_KEY, blob.storageKey())
                .set(BLOBS.FILE_NAME, blob.fileName())
                .set(BLOBS.CONTENT_TYPE, blob.contentType())
                .set(BLOBS.BYTE_SIZE, blob.byteSize())
                .set(BLOBS.CREATED_AT, blob.createdAt())
                .execute();
    }

    @Override
    public Optional<Blob> findById(UUID blobId) {
        return dslContext
                .selectFrom(BLOBS)
                .where(BLOBS.ID.eq(blobId))
                .fetchOptional()
                .map(JooqBlobRepository::toDomain);
    }

    @Override
    public List<Blob> findAllById(Collection<UUID> blobIds) {
        if (blobIds.isEmpty()) {
            return List.of();
        }
        return dslContext.selectFrom(BLOBS).where(BLOBS.ID.in(blobIds)).fetch(JooqBlobRepository::toDomain);
    }

    @Override
    public void deleteById(UUID blobId) {
        dslContext.deleteFrom(BLOBS).where(BLOBS.ID.eq(blobId)).execute();
    }

    private static Blob toDomain(BlobsRecord blobsRecord) {
        return Blob.restore(
                blobsRecord.getId(),
                blobsRecord.getStorageKey(),
                blobsRecord.getFileName(),
                blobsRecord.getContentType(),
                blobsRecord.getByteSize(),
                blobsRecord.getCreatedAt());
    }
}
