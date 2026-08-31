package xyz.gentask.module.file.infrastructure;

import static xyz.gentask.jooq.Tables.ATTACHMENTS;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.AttachmentsRecord;
import xyz.gentask.module.file.domain.attachment.Attachment;
import xyz.gentask.module.file.domain.attachment.AttachmentRepository;

@Repository
@RequiredArgsConstructor
class JooqAttachmentRepository implements AttachmentRepository {

    private final DSLContext dslContext;

    @Override
    public void save(Attachment attachment) {
        dslContext
                .insertInto(ATTACHMENTS)
                .set(ATTACHMENTS.ID, attachment.id())
                .set(ATTACHMENTS.BLOB_ID, attachment.blobId())
                .set(ATTACHMENTS.OWNER_TYPE, attachment.ownerType())
                .set(ATTACHMENTS.OWNER_ID, attachment.ownerId())
                .set(ATTACHMENTS.NAME, attachment.name())
                .set(ATTACHMENTS.CREATED_AT, attachment.createdAt())
                .execute();
    }

    @Override
    public List<Attachment> findBySlot(String ownerType, UUID ownerId, String name) {
        return dslContext
                .selectFrom(ATTACHMENTS)
                .where(atSlot(ownerType, ownerId, name))
                .orderBy(ATTACHMENTS.CREATED_AT.asc())
                .fetch(JooqAttachmentRepository::toDomain);
    }

    @Override
    public Optional<Attachment> findById(UUID attachmentId) {
        return dslContext
                .selectFrom(ATTACHMENTS)
                .where(ATTACHMENTS.ID.eq(attachmentId))
                .fetchOptional()
                .map(JooqAttachmentRepository::toDomain);
    }

    @Override
    public int countBySlot(String ownerType, UUID ownerId, String name) {
        return dslContext.fetchCount(ATTACHMENTS, atSlot(ownerType, ownerId, name));
    }

    @Override
    public void deleteById(UUID attachmentId) {
        dslContext
                .deleteFrom(ATTACHMENTS)
                .where(ATTACHMENTS.ID.eq(attachmentId))
                .execute();
    }

    private static Condition atSlot(String ownerType, UUID ownerId, String name) {
        return ATTACHMENTS
                .OWNER_TYPE
                .eq(ownerType)
                .and(ATTACHMENTS.OWNER_ID.eq(ownerId))
                .and(ATTACHMENTS.NAME.eq(name));
    }

    private static Attachment toDomain(AttachmentsRecord attachmentsRecord) {
        return Attachment.restore(
                attachmentsRecord.getId(),
                attachmentsRecord.getBlobId(),
                attachmentsRecord.getOwnerType(),
                attachmentsRecord.getOwnerId(),
                attachmentsRecord.getName(),
                attachmentsRecord.getCreatedAt());
    }
}
