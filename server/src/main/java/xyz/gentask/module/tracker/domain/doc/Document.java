package xyz.gentask.module.tracker.domain.doc;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 문서.
 *
 * 본문을 갖지 않는다. 본문은 개정이 가지며 문서는 지금 어느 개정이 참인지를 가리킬 뿐이다
 * (DOC-001 · DOC-003).
 *
 * 제목과 고친 때는 지금 참인 개정을 따라간다. 목록 한 화면을 내려고 개정을 매번 잇지 않으려는
 * 것이며, 개정을 남기는 자리가 이 셋을 함께 옮긴다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Document {

    @NonNull private final UUID id;

    // 담긴 프로젝트
    @NonNull private final UUID projectId;

    // 지금 참인 개정의 제목을 앞당겨 둔 것
    @NonNull private DocumentTitle title;

    // 지금 참인 개정. 첫 개정을 담기 전의 한순간만 비어 있다
    private UUID headRevisionId;

    // 담긴 폴더. 비어 있으면 뿌리에 선다
    private UUID folderId;

    private Instant deletedAt;

    private UUID deletedBy;

    @NonNull private final Instant createdAt;

    @NonNull private final UUID createdBy;

    @NonNull private Instant updatedAt;

    @NonNull private UUID updatedBy;

    public static Document create(
            UUID id, UUID projectId, DocumentTitle title, UUID folderId, UUID authorId, Instant now) {
        return new Document(id, projectId, title, null, folderId, null, null, now, authorId, now, authorId);
    }

    public static Document restore(
            UUID id,
            UUID projectId,
            DocumentTitle title,
            UUID headRevisionId,
            UUID folderId,
            Instant deletedAt,
            UUID deletedBy,
            Instant createdAt,
            UUID createdBy,
            Instant updatedAt,
            UUID updatedBy) {
        return new Document(
                id,
                projectId,
                title,
                headRevisionId,
                folderId,
                deletedAt,
                deletedBy,
                createdAt,
                createdBy,
                updatedAt,
                updatedBy);
    }

    public boolean belongsTo(@NonNull UUID candidateProjectId) {
        return projectId.equals(candidateProjectId);
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * 최신 유효 개정 및 제목, 수정 정보를 갱신한다.
     */
    public void moveHead(@NonNull UUID revisionId, @NonNull DocumentTitle title, @NonNull UUID editorId, Instant now) {
        this.headRevisionId = revisionId;
        this.title = title;
        this.updatedAt = now;
        this.updatedBy = editorId;
    }

    /**
     * 소속 폴더를 변경한다. null인 경우 루트 폴더로 이동한다(DOC-006 A1).
     * 폴더 이동은 문서 내용 변경이 아니므로 수정 시각을 변경하지 않는다(DOC-006).
     */
    public void moveTo(UUID folderId) {
        this.folderId = folderId;
    }
}
