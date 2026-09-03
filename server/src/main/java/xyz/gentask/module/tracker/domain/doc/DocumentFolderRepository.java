package xyz.gentask.module.tracker.domain.doc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** 폴더를 담는 자리. */
public interface DocumentFolderRepository {

    void save(DocumentFolder folder);

    /**
     * 프로젝트 안에서 폴더 하나를 찾는다.
     *
     * <p>프로젝트를 함께 받는다. 남의 것을 그 자리에서 걸러야 "있으나 권한이 없다"가 새어 나가지
     * 않는다(DOC-008 A9).
     */
    Optional<DocumentFolder> findById(UUID projectId, UUID folderId);

    /** 바로 아래의 폴더. 지울 때 한 단계 위로 올리는 자리가 이것을 쓴다(DOC-008 A7). */
    List<DocumentFolder> findChildren(UUID parentId);

    void deleteById(UUID folderId);
}
