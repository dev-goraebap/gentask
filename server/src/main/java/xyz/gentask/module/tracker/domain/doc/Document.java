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
 * <p>본문을 갖지 않는다. 본문은 개정이 가지며 문서는 지금 어느 개정이 참인지를 가리킬 뿐이다
 * (DOC-001 · DOC-003).
 *
 * <p>제목과 고친 때는 지금 참인 개정을 따라간다. 목록 한 화면을 내려고 개정을 매번 잇지 않으려는
 * 것이며, 개정을 남기는 자리가 이 셋을 함께 옮긴다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Document {

    // 식별자
    @NonNull private final UUID id;

    // 담긴 프로젝트
    @NonNull private final UUID projectId;

    // 지금 참인 개정의 제목을 앞당겨 둔 것
    @NonNull private DocumentTitle title;

    // 지금 참인 개정. 첫 개정을 담기 전의 한순간만 비어 있다
    private UUID headRevisionId;

    // 담긴 폴더. 비어 있으면 뿌리에 선다
    private UUID folderId;

    // 지운 순간. 지운 것을 곧바로 없애지 않는다
    private Instant deletedAt;

    // 지운 사람
    private UUID deletedBy;

    // 만든 시각
    @NonNull private final Instant createdAt;

    // 세운 사람
    @NonNull private final UUID createdBy;

    // 고친 시각. 지금 참인 개정을 남긴 때다
    @NonNull private Instant updatedAt;

    // 마지막으로 고친 사람
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
     * 지금 참인 개정을 옮긴다.
     *
     * <p>제목과 고친 때가 함께 옮겨 간다. 따로 두면 목록이 내는 제목과 상세가 내는 개정의 제목이 서로
     * 다른 것을 가리킨다.
     */
    public void moveHead(@NonNull UUID revisionId, @NonNull DocumentTitle title, @NonNull UUID editorId, Instant now) {
        this.headRevisionId = revisionId;
        this.title = title;
        this.updatedAt = now;
        this.updatedBy = editorId;
    }

    /**
     * 담긴 자리를 옮긴다. 비어 있는 자리는 뿌리다(DOC-006 A1).
     *
     * <p>고친 때와 고친 사람이 따라가지 않는다. 그 둘은 지금 참인 개정을 남긴 자리를 가리키는데
     * 옮기는 것은 개정이 아니므로(DOC-006), 함께 옮기면 목록의 "고친 때"가 이력의 마지막 줄과 다른
     * 것을 말하게 된다. 그래서 시각을 받지 않는다.
     */
    public void moveTo(UUID folderId) {
        this.folderId = folderId;
    }
}
