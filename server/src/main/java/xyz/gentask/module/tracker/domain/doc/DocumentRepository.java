package xyz.gentask.module.tracker.domain.doc;

import java.util.Optional;
import java.util.UUID;

/**
 * 문서와 그 개정을 담는 자리.
 *
 * <p>개정에 저장소를 따로 두지 않는다. 개정은 홀로 서지 않고 언제나 문서를 지나서만 닿으며, 문서를
 * 담는 것과 개정을 남기는 것이 한 트랜잭션 안에서 함께 일어나기 때문이다. 두 개의 저장소로 나누면
 * 그 한 번의 일이 두 포트에 걸쳐 반쪽씩 놓인다.
 */
public interface DocumentRepository {

    void save(Document document);

    /**
     * 프로젝트 안에서 문서 하나를 찾는다.
     *
     * <p>프로젝트를 함께 받는다. 식별자가 전역으로 유일하므로 그것만으로 하나가 가려지지만, 남의 것을
     * 그 자리에서 걸러야 "있으나 권한이 없다"가 새어 나가지 않는다(DOC-002 A4).
     *
     * <p>지워진 것은 없는 것으로 낸다(DOC-002 A3).
     */
    Optional<Document> findById(UUID projectId, UUID documentId);

    /** 개정을 남긴다. 앞의 것을 고치거나 지우지 않으므로 담기만 한다. */
    void append(DocumentRevision revision);

    Optional<DocumentRevision> findRevisionById(UUID revisionId);

    /** 되돌릴 자리를 사람이 부른 번호로 찾는다(DOC-005). */
    Optional<DocumentRevision> findRevisionByNo(UUID documentId, int revisionNo);
}
