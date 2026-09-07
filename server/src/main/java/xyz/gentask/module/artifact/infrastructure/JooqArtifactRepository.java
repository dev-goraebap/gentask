package xyz.gentask.module.artifact.infrastructure;

import static xyz.gentask.jooq.Tables.ARTIFACTS;
import static xyz.gentask.jooq.Tables.ARTIFACT_REVISIONS;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.ArtifactRevisionsRecord;
import xyz.gentask.jooq.tables.records.ArtifactsRecord;
import xyz.gentask.module.artifact.domain.artifact.Artifact;
import xyz.gentask.module.artifact.domain.artifact.ArtifactBody;
import xyz.gentask.module.artifact.domain.artifact.ArtifactRepository;
import xyz.gentask.module.artifact.domain.artifact.ArtifactRevision;
import xyz.gentask.module.artifact.domain.artifact.ArtifactTitle;
import xyz.gentask.module.artifact.domain.artifact.RevisionComment;

@Repository
@RequiredArgsConstructor
class JooqArtifactRepository implements ArtifactRepository {

    private final DSLContext dslContext;

    @Override
    public boolean insert(Artifact artifact) {
        return dslContext
                        .insertInto(ARTIFACTS)
                        .set(ARTIFACTS.ID, artifact.id())
                        .set(ARTIFACTS.PROJECT_ID, artifact.projectId())
                        .set(ARTIFACTS.TITLE, artifact.title().value())
                        .set(ARTIFACTS.HEAD_REVISION_ID, artifact.headRevisionId())
                        .set(ARTIFACTS.FOLDER_ID, artifact.folderId())
                        .set(ARTIFACTS.DELETED_AT, artifact.deletedAt())
                        .set(ARTIFACTS.DELETED_BY, artifact.deletedBy())
                        .set(ARTIFACTS.CREATED_AT, artifact.createdAt())
                        .set(ARTIFACTS.CREATED_BY, artifact.createdBy())
                        .set(ARTIFACTS.UPDATED_AT, artifact.updatedAt())
                        .set(ARTIFACTS.UPDATED_BY, artifact.updatedBy())
                        .onConflict(ARTIFACTS.ID)
                        .doNothing()
                        .execute()
                == 1;
    }

    @Override
    public void save(Artifact artifact) {
        dslContext
                .insertInto(ARTIFACTS)
                .set(ARTIFACTS.ID, artifact.id())
                .set(ARTIFACTS.PROJECT_ID, artifact.projectId())
                .set(ARTIFACTS.TITLE, artifact.title().value())
                .set(ARTIFACTS.HEAD_REVISION_ID, artifact.headRevisionId())
                .set(ARTIFACTS.FOLDER_ID, artifact.folderId())
                .set(ARTIFACTS.DELETED_AT, artifact.deletedAt())
                .set(ARTIFACTS.DELETED_BY, artifact.deletedBy())
                .set(ARTIFACTS.CREATED_AT, artifact.createdAt())
                .set(ARTIFACTS.CREATED_BY, artifact.createdBy())
                .set(ARTIFACTS.UPDATED_AT, artifact.updatedAt())
                .set(ARTIFACTS.UPDATED_BY, artifact.updatedBy())
                .onConflict(ARTIFACTS.ID)
                .doUpdate()
                .set(ARTIFACTS.TITLE, artifact.title().value())
                .set(ARTIFACTS.HEAD_REVISION_ID, artifact.headRevisionId())
                .set(ARTIFACTS.FOLDER_ID, artifact.folderId())
                .set(ARTIFACTS.DELETED_AT, artifact.deletedAt())
                .set(ARTIFACTS.DELETED_BY, artifact.deletedBy())
                .set(ARTIFACTS.UPDATED_AT, artifact.updatedAt())
                .set(ARTIFACTS.UPDATED_BY, artifact.updatedBy())
                .execute();
    }

    @Override
    public Optional<Artifact> findById(String projectId, String artifactId) {
        return dslContext
                .selectFrom(ARTIFACTS)
                .where(ARTIFACTS.ID.eq(artifactId))
                .and(ARTIFACTS.PROJECT_ID.eq(projectId))
                .and(ARTIFACTS.DELETED_AT.isNull())
                .fetchOptional()
                .map(JooqArtifactRepository::toDomain);
    }

    @Override
    public Optional<Artifact> findByIdForUpdate(String projectId, String artifactId) {
        return dslContext
                .selectFrom(ARTIFACTS)
                .where(ARTIFACTS.ID.eq(artifactId))
                .and(ARTIFACTS.PROJECT_ID.eq(projectId))
                .and(ARTIFACTS.DELETED_AT.isNull())
                .forUpdate()
                .fetchOptional()
                .map(JooqArtifactRepository::toDomain);
    }

    /*
     * 폴더 이동 시 논리 삭제된 아티팩트도 참조 정합성을 위해 함께 이동 대상에 포함한다(DOC-008 A7).
     */
    @Override
    public List<Artifact> findAllInFolder(String folderId) {
        return dslContext
                .selectFrom(ARTIFACTS)
                .where(ARTIFACTS.FOLDER_ID.eq(folderId))
                .fetch(JooqArtifactRepository::toDomain);
    }

    @Override
    public void append(ArtifactRevision revision) {
        dslContext
                .insertInto(ARTIFACT_REVISIONS)
                .set(ARTIFACT_REVISIONS.ID, revision.id())
                .set(ARTIFACT_REVISIONS.ARTIFACT_ID, revision.artifactId())
                .set(ARTIFACT_REVISIONS.REVISION_NO, revision.revisionNo())
                .set(ARTIFACT_REVISIONS.TITLE, revision.title().value())
                .set(ARTIFACT_REVISIONS.BODY, revision.body().value())
                .set(ARTIFACT_REVISIONS.CONTENT_SHA1, revision.contentSha1())
                .set(ARTIFACT_REVISIONS.COMMENT, revision.comment().orNull())
                .set(ARTIFACT_REVISIONS.CREATED_AT, revision.createdAt())
                .set(ARTIFACT_REVISIONS.CREATED_BY, revision.createdBy())
                .execute();
    }

    @Override
    public Optional<ArtifactRevision> findRevisionById(UUID revisionId) {
        return dslContext
                .selectFrom(ARTIFACT_REVISIONS)
                .where(ARTIFACT_REVISIONS.ID.eq(revisionId))
                .fetchOptional()
                .map(JooqArtifactRepository::toDomain);
    }

    @Override
    public Optional<ArtifactRevision> findRevisionByNo(String artifactId, int revisionNo) {
        return dslContext
                .selectFrom(ARTIFACT_REVISIONS)
                .where(ARTIFACT_REVISIONS.ARTIFACT_ID.eq(artifactId))
                .and(ARTIFACT_REVISIONS.REVISION_NO.eq(revisionNo))
                .fetchOptional()
                .map(JooqArtifactRepository::toDomain);
    }

    private static Artifact toDomain(ArtifactsRecord artifactsRecord) {
        return Artifact.restore(
                artifactsRecord.getId(),
                artifactsRecord.getProjectId(),
                ArtifactTitle.of(artifactsRecord.getTitle()),
                artifactsRecord.getHeadRevisionId(),
                artifactsRecord.getFolderId(),
                artifactsRecord.getDeletedAt(),
                artifactsRecord.getDeletedBy(),
                artifactsRecord.getCreatedAt(),
                artifactsRecord.getCreatedBy(),
                artifactsRecord.getUpdatedAt(),
                artifactsRecord.getUpdatedBy());
    }

    private static ArtifactRevision toDomain(ArtifactRevisionsRecord artifactRevisionsRecord) {
        return ArtifactRevision.restore(
                artifactRevisionsRecord.getId(),
                artifactRevisionsRecord.getArtifactId(),
                artifactRevisionsRecord.getRevisionNo(),
                ArtifactTitle.of(artifactRevisionsRecord.getTitle()),
                ArtifactBody.of(artifactRevisionsRecord.getBody()),
                artifactRevisionsRecord.getContentSha1(),
                RevisionComment.of(artifactRevisionsRecord.getComment()),
                artifactRevisionsRecord.getCreatedAt(),
                artifactRevisionsRecord.getCreatedBy());
    }
}
