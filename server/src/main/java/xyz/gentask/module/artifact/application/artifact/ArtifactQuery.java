package xyz.gentask.module.artifact.application.artifact;

import java.util.List;
import java.util.Optional;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.ArtifactSummary;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.ArtifactView;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.FolderSummary;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.VersionSummary;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.VersionView;

public interface ArtifactQuery {

    List<ArtifactSummary> findAll(String projectId);

    /**
     * 프로젝트의 폴더 전부. 평평하게 내고 트리로 세우는 것은 읽는 쪽이 한다(DOC-008).
     *
     * 바로 아래에 담긴 아티팩트와 폴더의 수를 함께 센다. 지우기 전에 되묻는 자리가 그것을 쓴다.
     */
    List<FolderSummary> findFolders(String projectId);

    Optional<ArtifactView> findOne(String projectId, String artifactId);

    /**
     * 개정 이력 한 쪽. 최근 것부터 낸다(DOC-004).
     *
     * 프로젝트를 함께 받아 남의 것과 지워진 것을 그 자리에서 걸러 낸다(DOC-004 A4 · A5).
     */
    List<VersionSummary> findRevisions(String projectId, String artifactId, int limit, int offset);

    /** 이 아티팩트의 개정 수. 지워졌거나 남의 것이면 0 이다. */
    long countRevisions(String projectId, String artifactId);

    /** 개정 하나. 그때의 제목과 본문을 낸다(DOC-004). */
    Optional<VersionView> findRevision(String projectId, String artifactId, int revisionNo);
}
