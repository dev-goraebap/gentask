package xyz.gentask.module.file.application;

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
import xyz.gentask.module.file.AttachmentSlot;
import xyz.gentask.module.file.AttachmentView;
import xyz.gentask.module.file.Attachments;
import xyz.gentask.module.file.domain.attachment.Attachment;
import xyz.gentask.module.file.domain.attachment.AttachmentRepository;
import xyz.gentask.module.file.domain.blob.Blob;
import xyz.gentask.module.file.domain.blob.BlobRepository;
import xyz.gentask.module.file.domain.pending.PendingUpload;
import xyz.gentask.module.file.domain.pending.PendingUploadRepository;
import xyz.gentask.shared.storage.ObjectStorage;
import xyz.gentask.shared.storage.PresignedUpload;

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

    // --- Presigned URL 발급 -------------------------------------------------------------------------------------------

    /**
     * 스토리지 업로드용 Presigned URL을 발급한다. 엔터티 소유권 및 첨부 개수 제한 검증은 실제 첨부 시점에 각 도메인 모듈이 수행한다.
     */
    @Transactional
    public PresignedUpload presign(AttachmentSlot slot, UUID actorId, String fileName, String contentType, long size) {
        if (!slot.accepts(contentType)) {
            throw FileErrorCode.FILE_TYPE_NOT_ALLOWED.raise();
        }
        if (size > slot.maxBytes()) {
            throw FileErrorCode.FILE_TOO_LARGE.raise();
        }

        Instant now = clock.instant();
        String storageKey = slot.storagePrefix() + "/" + KEY_DATE.format(now) + "/" + UUID.randomUUID();
        pendingUploadRepository.save(
                PendingUpload.issue(UUID.randomUUID(), storageKey, slot.name(), fileName, contentType, actorId, now));
        return new PresignedUpload(storageKey, objectStorage.presignPut(storageKey, contentType, UPLOAD_EXPIRY));
    }

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
    public AttachmentView attach(AttachmentSlot slot, UUID ownerId, UUID actorId, String storageKey) {
        // 미발급 키나 타인의 발급 키는 첨부를 거부한다.
        PendingUpload pending = pendingUploadRepository
                .findByStorageKey(storageKey)
                .filter(found -> found.isIssued(slot.name(), actorId))
                .orElseThrow(FileErrorCode.FILE_NOT_UPLOADED::raise);

        if (!slot.isSingle() && countAt(slot, ownerId) >= slot.maxCount()) {
            discard(pending);
            throw FileErrorCode.FILE_LIMIT_EXCEEDED.raise();
        }

        // 발급과 업로드 사이의 페이로드 변조를 방지하기 위해 스토리지 실측 크기로 검증한다.
        long byteSize = objectStorage.sizeOf(storageKey).orElseThrow(FileErrorCode.FILE_NOT_UPLOADED::raise);
        if (byteSize > slot.maxBytes()) {
            discard(pending);
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

    /** 검증 실패한 업로드 파일은 스토리지와 대기 목록 양쪽에서 즉시 삭제한다. */
    private void discard(PendingUpload pending) {
        objectStorage.delete(pending.storageKey());
        pendingUploadRepository.deleteById(pending.id());
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
