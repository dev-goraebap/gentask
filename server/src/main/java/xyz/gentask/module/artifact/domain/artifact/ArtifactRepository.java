package xyz.gentask.module.artifact.domain.artifact;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import xyz.gentask.module.artifact.domain.ArtifactScope;

/**
 * 아티팩트 및 개정 이력 저장소 포트 인터페이스다.
 */
public interface ArtifactRepository {

    boolean insert(Artifact artifact);

    void save(Artifact artifact);

    /**
     * 프로젝트 식별자와 아티팩트 식별자로 유효한 아티팩트를 조회한다. 논리 삭제된 아티팩트는 제외한다(DOC-002 A3, A4).
     */
    Optional<Artifact> findById(ArtifactScope projectId, String artifactId);

    Optional<Artifact> findByIdForUpdate(ArtifactScope projectId, String artifactId);

    /**
     * 특정 폴더에 소속된 모든 아티팩트를 조회한다. 폴더 삭제 시 상위 승격을 위해 논리 삭제된 아티팩트도 포함한다(DOC-008 A7).
     */
    List<Artifact> findAllInFolder(String folderId);

    /** 신규 개정을 추가한다. */
    void append(ArtifactRevision revision);

    Optional<ArtifactRevision> findRevisionById(UUID revisionId);

    /** 특정 아티팩트의 개정 번호로 개정 상세를 조회한다(DOC-005). */
    Optional<ArtifactRevision> findRevisionByNo(String artifactId, int revisionNo);
}
