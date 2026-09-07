package xyz.gentask.module.artifact.infrastructure;

import static xyz.gentask.jooq.Tables.ARTIFACT_COMMENTS;
import static xyz.gentask.jooq.Tables.USERS;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.artifact.application.comment.ArtifactCommentStore;
import xyz.gentask.module.artifact.application.comment.ArtifactCommentViews.CommentView;

@Repository
@RequiredArgsConstructor
class JooqArtifactCommentStore implements ArtifactCommentStore {
    private final DSLContext dsl;

    @Override
    public boolean deleteOwn(String id, UUID revisionId, UUID authorId) {
        return dsl.deleteFrom(ARTIFACT_COMMENTS)
                        .where(ARTIFACT_COMMENTS.ID.eq(id))
                        .and(ARTIFACT_COMMENTS.REVISION_ID.eq(revisionId))
                        .and(ARTIFACT_COMMENTS.CREATED_BY.eq(authorId))
                        .execute()
                == 1;
    }

    @Override
    public boolean insert(
            String id, UUID revisionId, Integer start, Integer end, String body, UUID authorId, Instant createdAt) {
        return dsl.insertInto(ARTIFACT_COMMENTS)
                        .set(ARTIFACT_COMMENTS.ID, id)
                        .set(ARTIFACT_COMMENTS.REVISION_ID, revisionId)
                        .set(ARTIFACT_COMMENTS.BLOCK_START, start)
                        .set(ARTIFACT_COMMENTS.BLOCK_END, end)
                        .set(ARTIFACT_COMMENTS.BODY, body)
                        .set(ARTIFACT_COMMENTS.CREATED_BY, authorId)
                        .set(ARTIFACT_COMMENTS.CREATED_AT, createdAt)
                        .onConflict(ARTIFACT_COMMENTS.ID)
                        .doNothing()
                        .execute()
                == 1;
    }

    @Override
    public List<CommentView> list(UUID revisionId, int versionNo, String source) {
        return dsl.select(ARTIFACT_COMMENTS.fields())
                .select(USERS.NICKNAME)
                .from(ARTIFACT_COMMENTS)
                .join(USERS)
                .on(USERS.ID.eq(ARTIFACT_COMMENTS.CREATED_BY))
                .where(ARTIFACT_COMMENTS.REVISION_ID.eq(revisionId))
                .orderBy(ARTIFACT_COMMENTS.CREATED_AT.asc(), ARTIFACT_COMMENTS.ID.asc())
                .fetch(row -> {
                    Integer start = row.get(ARTIFACT_COMMENTS.BLOCK_START);
                    Integer end = row.get(ARTIFACT_COMMENTS.BLOCK_END);
                    return new CommentView(
                            row.get(ARTIFACT_COMMENTS.ID),
                            versionNo,
                            start,
                            end,
                            start == null ? null : source.substring(start, end),
                            row.get(ARTIFACT_COMMENTS.BODY),
                            row.get(ARTIFACT_COMMENTS.CREATED_BY),
                            row.get(USERS.NICKNAME),
                            row.get(ARTIFACT_COMMENTS.CREATED_AT));
                });
    }
}
