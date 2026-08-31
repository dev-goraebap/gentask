package xyz.gentask.module.file;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * file 모듈이 제공하는 인터페이스(in). 첨부를 쓰는 모듈은 이 자리만 참조한다.
 *
 * <p>자리 발급은 여기 없다. 그것은 어느 레코드에 붙을지와 무관한 일이라 file 의 컨트롤러가 직접 받으며,
 * 이 인터페이스는 발급된 것을 도메인 레코드에 매는 일부터 다룬다.
 *
 * <p>그 레코드에 손댈 자격이 있는지는 판정하지 않는다. 부르는 쪽이 자기 도메인 규칙으로 이미 판정한 뒤
 * 부르며, file 은 그 판정을 되풀이할 근거를 갖지 않는다. {@code actorId} 를 받는 것은 자격을 다시 보기
 * 위해서가 아니라 그 사람이 발급받은 자리인지만 확인하기 위해서다.
 */
public interface Attachments {

    /**
     * 올라간 것을 그 자리에 붙인다. 자리 하나뿐인 slot 이면 앞의 것을 밀어낸다.
     *
     * @param ownerId 붙을 레코드. 부르는 쪽이 이미 소유를 판정했다
     * @param actorId 붙이는 사람. 발급자와 같아야 한다
     */
    AttachmentView attach(AttachmentSlot slot, UUID ownerId, UUID actorId, String storageKey);

    List<AttachmentView> list(AttachmentSlot slot, UUID ownerId);

    /** 자리 하나뿐인 slot 을 위한 조회. */
    Optional<AttachmentView> findSingle(AttachmentSlot slot, UUID ownerId);

    /** 그 자리의 첨부 하나를 뗀다. 다른 자리의 것을 가리키면 없는 것으로 본다. */
    void detach(AttachmentSlot slot, UUID ownerId, UUID attachmentId);

    /** 그 자리의 첨부를 모두 뗀다. owner 가 사라질 때 소유 모듈이 부른다. */
    void detachAll(AttachmentSlot slot, UUID ownerId);
}
