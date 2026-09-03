package xyz.gentask.module.tracker.domain.doc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 문서 및 개정 이력 저장소 포트 인터페이스다.
 */
public interface DocumentRepository {

    void save(Document document);

    /**
     * 프로젝트 식별자와 문서 식별자로 유효한 문서를 조회한다. 논리 삭제된 문서는 제외한다(DOC-002 A3, A4).
     */
    Optional<Document> findById(UUID projectId, UUID documentId);

    /**
     * 특정 폴더에 소속된 모든 문서를 조회한다. 폴더 삭제 시 상위 승격을 위해 논리 삭제된 문서도 포함한다(DOC-008 A7).
     */
    List<Document> findAllInFolder(UUID folderId);

    /** 신규 개정을 추가한다. */
    void append(DocumentRevision revision);

    Optional<DocumentRevision> findRevisionById(UUID revisionId);

    /** 특정 문서의 개정 번호로 개정 상세를 조회한다(DOC-005). */
    Optional<DocumentRevision> findRevisionByNo(UUID documentId, int revisionNo);
}
