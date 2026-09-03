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
 * <p>담을 뿐 상태나 권한을 갖지 않는다. 어느 폴더에 두었는지가 그 문서를 누가 보는지를 바꾸지 않으며
 * 귀속은 프로젝트가 갖는다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class DocumentFolder {

    // 식별자
    @NonNull private final UUID id;

    // 담긴 프로젝트
    @NonNull private final UUID projectId;

    // 사람이 부르는 이름. 겹쳐도 막지 않는다
    @NonNull private DocumentFolderName name;

    // 담긴 자리. 비어 있으면 뿌리에 선다
    private UUID parentId;

    // 세운 시각
    @NonNull private final Instant createdAt;

    // 세운 사람
    @NonNull private final UUID createdBy;

    // 이름을 바꾸거나 옮긴 시각
    @NonNull private Instant updatedAt;

    // 마지막으로 손댄 사람
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

    /** 이름을 바꿔도 그 폴더를 가리키던 길은 끊기지 않는다(DOC-008 A4). */
    public void rename(@NonNull DocumentFolderName name, @NonNull UUID editorId, Instant now) {
        this.name = name;
        this.updatedAt = now;
        this.updatedBy = editorId;
    }

    /**
     * 다른 자리로 옮긴다. 담긴 문서와 하위 폴더는 이 폴더를 가리키고 있으므로 함께 간다(DOC-008 A5).
     *
     * <p>비어 있는 자리는 뿌리다. 자기 자신이나 자기 자손을 받으면 최상위에서 어느 길로도 닿지 않는
     * 자리가 생기므로, 부르는 쪽이 그것을 먼저 가려낸다(DOC-008 A6).
     */
    public void moveTo(UUID parentId, @NonNull UUID editorId, Instant now) {
        this.parentId = parentId;
        this.updatedAt = now;
        this.updatedBy = editorId;
    }
}
