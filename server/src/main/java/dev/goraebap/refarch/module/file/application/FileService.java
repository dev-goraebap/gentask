package dev.goraebap.refarch.module.file.application;

import dev.goraebap.refarch.module.file.AttachmentSlot;
import dev.goraebap.refarch.module.file.AttachmentView;
import dev.goraebap.refarch.module.file.Attachments;
import dev.goraebap.refarch.module.file.domain.attachment.Attachment;
import dev.goraebap.refarch.module.file.domain.attachment.AttachmentRepository;
import dev.goraebap.refarch.module.file.domain.blob.Blob;
import dev.goraebap.refarch.module.file.domain.blob.BlobRepository;
import dev.goraebap.refarch.module.file.domain.pending.PendingUpload;
import dev.goraebap.refarch.module.file.domain.pending.PendingUploadRepository;
import dev.goraebap.refarch.shared.storage.ObjectStorage;
import dev.goraebap.refarch.shared.storage.PresignedUpload;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FileService implements Attachments {

    // --- 상수 --------------------------------------------------------------------------------------------------------
    private static final Duration UPLOAD_EXPIRY = Duration.ofMinutes(10);

    private static final Duration DOWNLOAD_EXPIRY = Duration.ofMinutes(10);

    private static final DateTimeFormatter KEY_DATE =
            DateTimeFormatter.ofPattern("yyyy/MM").withZone(ZoneOffset.UTC);

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final BlobRepository blobRepository;
    private final AttachmentRepository attachmentRepository;
    private final PendingUploadRepository pendingUploadRepository;
    private final ObjectStorage objectStorage;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<AttachmentView> list(AttachmentSlot slot, UUID ownerId) {
        List<Attachment> attachments =
                attachmentRepository.findBySlot(slot.ownerType(), ownerId, slot.attachmentName());
        if (attachments.isEmpty()) {
            return List.of();
        }
        Map<UUID, Blob> blobs =
                blobRepository
                        .findAllById(
                                attachments.stream().map(Attachment::blobId).toList())
                        .stream()
                        .collect(Collectors.toMap(Blob::id, Function.identity()));
        return attachments.stream()
                .map(attachment -> toView(attachment, blobs.get(attachment.blobId())))
                .filter(Objects::nonNull)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AttachmentView> findSingle(AttachmentSlot slot, UUID ownerId) {
        return list(slot, ownerId).stream().findFirst();
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    @Override
    @Transactional
    public PresignedUpload presign(AttachmentSlot slot, UUID ownerId, String fileName, String contentType, long size) {
        if (!slot.accepts(contentType)) {
            throw FileErrorCode.FILE_TYPE_NOT_ALLOWED.raise();
        }
        if (size > slot.maxBytes()) {
            throw FileErrorCode.FILE_TOO_LARGE.raise();
        }
        if (!slot.isSingle() && countAt(slot, ownerId) >= slot.maxCount()) {
            throw FileErrorCode.FILE_LIMIT_EXCEEDED.raise();
        }

        Instant now = clock.instant();
        String storageKey = slot.storagePrefix() + "/" + KEY_DATE.format(now) + "/" + UUID.randomUUID();
        pendingUploadRepository.save(PendingUpload.issue(
                UUID.randomUUID(),
                storageKey,
                slot.ownerType(),
                ownerId,
                slot.attachmentName(),
                fileName,
                contentType,
                now));
        return new PresignedUpload(storageKey, objectStorage.presignPut(storageKey, contentType, UPLOAD_EXPIRY));
    }

    @Override
    @Transactional
    public AttachmentView attach(AttachmentSlot slot, UUID ownerId, String storageKey) {
        // 발급받지 않은 키로는 붙일 수 없다. 이 조회가 owner 일치까지 함께 판정한다
        PendingUpload pending = pendingUploadRepository
                .findByStorageKey(storageKey)
                .filter(found -> found.isAt(slot.ownerType(), ownerId, slot.attachmentName()))
                .orElseThrow(FileErrorCode.FILE_NOT_UPLOADED::raise);

        if (!slot.isSingle() && countAt(slot, ownerId) >= slot.maxCount()) {
            objectStorage.delete(storageKey);
            pendingUploadRepository.deleteById(pending.id());
            throw FileErrorCode.FILE_LIMIT_EXCEEDED.raise();
        }

        // 알린 크기가 아니라 보관소의 실측으로 판정한다. 발급과 업로드 사이에 바뀔 수 있다
        long byteSize = objectStorage.sizeOf(storageKey).orElseThrow(FileErrorCode.FILE_NOT_UPLOADED::raise);
        if (byteSize > slot.maxBytes()) {
            objectStorage.delete(storageKey);
            pendingUploadRepository.deleteById(pending.id());
            throw FileErrorCode.FILE_TOO_LARGE.raise();
        }

        if (slot.isSingle()) {
            detachAll(slot, ownerId);
        }

        Instant now = clock.instant();
        Blob blob = Blob.store(UUID.randomUUID(), storageKey, pending.fileName(), pending.contentType(), byteSize, now);
        blobRepository.save(blob);

        Attachment attachment =
                Attachment.attach(UUID.randomUUID(), blob.id(), slot.ownerType(), ownerId, slot.attachmentName(), now);
        attachmentRepository.save(attachment);
        pendingUploadRepository.deleteById(pending.id());

        return toView(attachment, blob);
    }

    @Override
    @Transactional
    public void detach(AttachmentSlot slot, UUID ownerId, UUID attachmentId) {
        Attachment attachment = attachmentRepository
                .findById(attachmentId)
                .filter(found -> found.isAt(slot.ownerType(), ownerId, slot.attachmentName()))
                .orElseThrow(FileErrorCode.FILE_NOT_FOUND::raise);
        remove(attachment);
    }

    @Override
    @Transactional
    public void detachAll(AttachmentSlot slot, UUID ownerId) {
        attachmentRepository
                .findBySlot(slot.ownerType(), ownerId, slot.attachmentName())
                .forEach(this::remove);
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------
    private int countAt(AttachmentSlot slot, UUID ownerId) {
        return attachmentRepository.countBySlot(slot.ownerType(), ownerId, slot.attachmentName());
    }

    private void remove(Attachment attachment) {
        blobRepository.findById(attachment.blobId()).ifPresent(blob -> {
            attachmentRepository.deleteById(attachment.id());
            blobRepository.deleteById(blob.id());
            objectStorage.delete(blob.storageKey());
        });
    }

    private AttachmentView toView(Attachment attachment, Blob blob) {
        if (blob == null) {
            return null;
        }
        return new AttachmentView(
                attachment.id(),
                blob.fileName(),
                blob.contentType(),
                blob.byteSize(),
                objectStorage.presignGet(blob.storageKey(), blob.fileName(), DOWNLOAD_EXPIRY),
                attachment.createdAt());
    }
}
