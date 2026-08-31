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

    // --- 자리 발급 ----------------------------------------------------------------------------------------------------

    /**
     * 보관소에 자리를 잡고 올릴 주소를 낸다. 어느 레코드에 붙을지는 여기서 정하지 않으므로 소유 판정도 하지
     * 않는다. 로그인한 사람이면 자리를 받을 수 있고, 그것을 실제로 매는 시점에 소유 모듈이 판정한다.
     *
     * <p>개수 제한을 여기서 보지 못하는 것은 붙을 레코드를 모르기 때문이며, 그 강제는 붙이는 자리가 갖는다.
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
        // 발급받지 않은 키로는 붙일 수 없다. 남이 발급받은 것도 마찬가지다
        PendingUpload pending = pendingUploadRepository
                .findByStorageKey(storageKey)
                .filter(found -> found.isIssued(slot.name(), actorId))
                .orElseThrow(FileErrorCode.FILE_NOT_UPLOADED::raise);

        if (!slot.isSingle() && countAt(slot, ownerId) >= slot.maxCount()) {
            discard(pending);
            throw FileErrorCode.FILE_LIMIT_EXCEEDED.raise();
        }

        // 알린 크기가 아니라 보관소의 실측으로 판정한다. 발급과 업로드 사이에 바뀔 수 있다
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

    /** 거절한 업로드는 보관소와 목록 양쪽에서 걷는다. 남겨 두면 청소가 다시 와야 한다. */
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
