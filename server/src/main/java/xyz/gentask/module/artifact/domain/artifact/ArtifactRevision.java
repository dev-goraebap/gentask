package xyz.gentask.module.artifact.domain.artifact;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 개정.
 *
 * 남긴 뒤 고치지 않는다. 그래서 상태를 바꾸는 메서드가 없고 고친 때와 고친 사람도 없다. 다음
 * 개정은 이 개정에서 나오며 번호가 하나 올라간다(DOC-003).
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class ArtifactRevision {

    /** 첫 개정의 번호. 아티팩트 안에서 1부터 매긴다. */
    public static final int FIRST_NO = 1;

    @NonNull private final UUID id;

    // 딸린 아티팩트
    @NonNull private final UUID artifactId;

    // 아티팩트 안의 번호. 사람이 몇 번째 개정인지를 이 값으로 부른다
    private final int revisionNo;

    // 이 개정이 참일 때의 제목
    @NonNull private final ArtifactTitle title;

    // 이 개정이 참일 때의 본문 전체
    @NonNull private final ArtifactBody body;

    // 본문의 SHA-1. 달라지지 않은 저장을 가르는 자리다
    @NonNull private final String contentSha1;

    // 왜 고쳤는지. 적지 않아도 된다
    @NonNull private final RevisionComment comment;

    // 남긴 시각
    @NonNull private final Instant createdAt;

    // 남긴 사람
    @NonNull private final UUID createdBy;

    /** 아티팩트를 세우는 것이 곧 이 개정을 남기는 것이다(DOC-001). */
    public static ArtifactRevision first(
            UUID id,
            UUID artifactId,
            ArtifactTitle title,
            ArtifactBody body,
            RevisionComment comment,
            UUID authorId,
            Instant now) {
        return new ArtifactRevision(id, artifactId, FIRST_NO, title, body, body.sha1(), comment, now, authorId);
    }

    public static ArtifactRevision restore(
            UUID id,
            UUID artifactId,
            int revisionNo,
            ArtifactTitle title,
            ArtifactBody body,
            String contentSha1,
            RevisionComment comment,
            Instant createdAt,
            UUID createdBy) {
        return new ArtifactRevision(
                id, artifactId, revisionNo, title, body, contentSha1, comment, createdAt, createdBy);
    }

    /** 이 개정 뒤에 올 것을 낸다. 이 개정은 그대로 남는다. */
    public ArtifactRevision next(
            @NonNull UUID id,
            @NonNull ArtifactTitle title,
            @NonNull ArtifactBody body,
            @NonNull RevisionComment comment,
            @NonNull UUID editorId,
            Instant now) {
        return new ArtifactRevision(id, artifactId, revisionNo + 1, title, body, body.sha1(), comment, now, editorId);
    }

    /**
     * 담으려는 것이 이 개정과 같은가.
     *
     * 본문은 SHA-1 로 견주고 제목은 짧으니 그대로 견준다. 같으면 개정을 만들지 않는다
     * (DOC-003 A2).
     */
    public boolean hasSameContent(@NonNull ArtifactTitle title, @NonNull ArtifactBody body) {
        return this.title.equals(title) && contentSha1.equals(body.sha1());
    }
}
