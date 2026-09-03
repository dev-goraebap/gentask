package xyz.gentask.module.tracker.domain.doc;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 문서를 담는 폴더. 폴더가 폴더를 담고 깊이를 제한하지 않는다(DOC-008).
 *
 * 담을 뿐 상태나 권한을 갖지 않는다. 어느 폴더에 두었는지가 그 문서를 누가 보는지를 바꾸지 않으며
 * 귀속은 프로젝트가 갖는다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class DocumentFolder {

    @NonNull private final UUID id;

    @NonNull private final UUID projectId;

    @NonNull private DocumentFolderName name;

    private UUID parentId;

    @NonNull private final Instant createdAt;

    @NonNull private final UUID createdBy;

    @NonNull private Instant updatedAt;

    @NonNull private UUID updatedBy;

    public static DocumentFolder create(
            UUID id, UUID projectId, DocumentFolderName name, UUID parentId, UUID authorId, Instant now) {
        return new DocumentFolder(id, projectId, name, parentId, now, authorId, now, authorId);
    }

    public static DocumentFolder restore(
            UUID id,
            UUID projectId,
            DocumentFolderName name,
            UUID parentId,
            Instant createdAt,
            UUID createdBy,
            Instant updatedAt,
            UUID updatedBy) {
        return new DocumentFolder(id, projectId, name, parentId, createdAt, createdBy, updatedAt, updatedBy);
    }

    public boolean belongsTo(@NonNull UUID candidateProjectId) {
        return projectId.equals(candidateProjectId);
    }

    /** 폴더명을 변경한다(DOC-008 A4). */
    public void rename(@NonNull DocumentFolderName name, @NonNull UUID editorId, Instant now) {
        this.name = name;
        this.updatedAt = now;
        this.updatedBy = editorId;
    }

    /**
     * 상위 폴더를 변경하여 폴더를 이동한다(DOC-008 A5).
     * null인 경우 최상위 루트로 이동한다. 순환 참조 검증은 호출 측에서 수행한다(DOC-008 A6).
     */
    public void moveTo(UUID parentId, @NonNull UUID editorId, Instant now) {
        this.parentId = parentId;
        this.updatedAt = now;
        this.updatedBy = editorId;
    }
}
