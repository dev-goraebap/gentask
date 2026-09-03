package xyz.gentask.module.tracker.domain.doc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** 문서 폴더 저장소 포트 인터페이스다. */
public interface DocumentFolderRepository {

    void save(DocumentFolder folder);

    /**
     * 프로젝트 식별자와 폴더 식별자로 폴더를 조회한다(DOC-008 A9).
     */
    Optional<DocumentFolder> findById(UUID projectId, UUID folderId);

    /** 지정한 상위 폴더의 직속 하위 자식 폴더 목록을 조회한다(DOC-008 A7). */
    List<DocumentFolder> findChildren(UUID parentId);

    void deleteById(UUID folderId);
}
