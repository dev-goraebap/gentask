package xyz.gentask.module.artifact.domain.folder;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 아티팩트를 담는 폴더. 폴더가 폴더를 담고 깊이를 제한하지 않는다(DOC-008).
 *
 * 담을 뿐 상태나 권한을 갖지 않는다. 어느 폴더에 두었는지가 그 아티팩트를 누가 보는지를 바꾸지 않으며
 * 귀속은 프로젝트가 갖는다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class ArtifactFolder {

    @NonNull private final String id;

    private final String projectId;

    @NonNull private ArtifactFolderName name;

    private String parentId;

    @NonNull private final Instant createdAt;

    @NonNull private final UUID createdBy;

    @NonNull private Instant updatedAt;

    @NonNull private UUID updatedBy;

    public static ArtifactFolder create(
            String id, String projectId, ArtifactFolderName name, String parentId, UUID authorId, Instant now) {
        return new ArtifactFolder(id, projectId, name, parentId, now, authorId, now, authorId);
    }

    public static ArtifactFolder restore(
            String id,
            String projectId,
            ArtifactFolderName name,
            String parentId,
            Instant createdAt,
            UUID createdBy,
            Instant updatedAt,
            UUID updatedBy) {
        return new ArtifactFolder(id, projectId, name, parentId, createdAt, createdBy, updatedAt, updatedBy);
    }

    public boolean belongsTo(@NonNull String candidateProjectId) {
        return java.util.Objects.equals(projectId, candidateProjectId);
    }

    /** 폴더명을 변경한다(DOC-008 A4). */
    public void rename(@NonNull ArtifactFolderName name, @NonNull UUID editorId, Instant now) {
        this.name = name;
        this.updatedAt = now;
        this.updatedBy = editorId;
    }

    /**
     * 상위 폴더를 변경하여 폴더를 이동한다(DOC-008 A5).
     * null인 경우 최상위 루트로 이동한다. 순환 참조 검증은 호출 측에서 수행한다(DOC-008 A6).
     */
    public void moveTo(String parentId, @NonNull UUID editorId, Instant now) {
        this.parentId = parentId;
        this.updatedAt = now;
        this.updatedBy = editorId;
    }
}
