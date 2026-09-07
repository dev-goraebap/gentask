package xyz.gentask.module.artifact.domain.folder;

import java.util.List;
import java.util.Optional;

/** 아티팩트 폴더 저장소 포트 인터페이스다. */
public interface ArtifactFolderRepository {

    boolean insert(ArtifactFolder folder);

    void save(ArtifactFolder folder);

    /**
     * 프로젝트 식별자와 폴더 식별자로 폴더를 조회한다(DOC-008 A9).
     */
    Optional<ArtifactFolder> findById(String projectId, String folderId);

    /** 지정한 상위 폴더의 직속 하위 자식 폴더 목록을 조회한다(DOC-008 A7). */
    List<ArtifactFolder> findChildren(String parentId);

    void deleteById(String folderId);
}
