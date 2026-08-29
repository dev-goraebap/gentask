package dev.goraebap.refarch.module.file;

import dev.goraebap.refarch.shared.storage.PresignedUpload;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * file 모듈이 제공하는 인터페이스(in). 첨부를 쓰는 모듈은 이 자리만 참조한다.
 *
 * <p>접근 권한은 다루지 않는다. 부르는 쪽이 자기 도메인 규칙으로 이미 판정한 뒤 부르며, file 은 그
 * 판정을 되풀이할 근거를 갖지 않는다. file 은 자기 컨트롤러를 두지 않으므로 판정을 건너뛴 직접
 * 진입점도 없다.
 */
public interface Attachments {

    /**
     * 올릴 자리를 잡고 업로드 주소를 낸다. 이 시점의 크기와 형식은 클라이언트가 알린 값이므로 붙일 때
     * 보관소의 실측으로 다시 본다.
     */
    PresignedUpload presign(AttachmentSlot slot, UUID ownerId, String fileName, String contentType, long size);

    /** 올라간 것을 그 자리에 붙인다. 자리 하나뿐인 slot 이면 앞의 것을 밀어낸다. */
    AttachmentView attach(AttachmentSlot slot, UUID ownerId, String storageKey);

    List<AttachmentView> list(AttachmentSlot slot, UUID ownerId);

    /** 자리 하나뿐인 slot 을 위한 조회. */
    Optional<AttachmentView> findSingle(AttachmentSlot slot, UUID ownerId);

    /** 그 자리의 첨부 하나를 뗀다. 다른 자리의 것을 가리키면 없는 것으로 본다. */
    void detach(AttachmentSlot slot, UUID ownerId, UUID attachmentId);

    /** 그 자리의 첨부를 모두 뗀다. owner 가 사라질 때 소유 모듈이 부른다. */
    void detachAll(AttachmentSlot slot, UUID ownerId);
}
