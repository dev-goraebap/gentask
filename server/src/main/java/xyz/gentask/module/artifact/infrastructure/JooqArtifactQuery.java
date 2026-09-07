package xyz.gentask.module.artifact.infrastructure;

import static xyz.gentask.jooq.Tables.ARTIFACTS;
import static xyz.gentask.jooq.Tables.ARTIFACT_FOLDERS;
import static xyz.gentask.jooq.Tables.ARTIFACT_REVISIONS;
import static xyz.gentask.jooq.Tables.USERS;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.Record5;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.ArtifactFolders;
import xyz.gentask.module.artifact.application.artifact.ArtifactQuery;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.ArtifactSummary;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.ArtifactView;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.FolderSummary;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.VersionSummary;
import xyz.gentask.module.artifact.application.artifact.ArtifactViews.VersionView;
import xyz.gentask.module.artifact.domain.ArtifactScope;

/**
 * 아티팩트 목록 및 상세 조회를 담당하는 jOOQ 쿼리 구현체다.
 */
@Repository
@RequiredArgsConstructor
class JooqArtifactQuery implements ArtifactQuery {

    private final DSLContext dslContext;

    @Override
    public List<ArtifactSummary> findAll(ArtifactScope projectId) {
        return dslContext
                .select(ARTIFACTS.ID, ARTIFACTS.TITLE, ARTIFACTS.FOLDER_ID, ARTIFACTS.CREATED_AT, ARTIFACTS.UPDATED_AT)
                .from(ARTIFACTS)
                .where(ArtifactScopeCondition.matches(projectId, ARTIFACTS.PROJECT_ID, ARTIFACTS.OWNER_ID))
                .and(ARTIFACTS.DELETED_AT.isNull())
                .orderBy(ARTIFACTS.UPDATED_AT.desc(), ARTIFACTS.ID.asc())
                .fetch(JooqArtifactQuery::toSummary);
    }

    /*
     * 폴더별 하위 아티팩트 및 자식 폴더 수를 집계한다(DOC-008 A7).
     */
    @Override
    public List<FolderSummary> findFolders(ArtifactScope projectId) {
        ArtifactFolders child = ARTIFACT_FOLDERS.as("child");
        Field<Integer> artifactCount = DSL.selectCount()
                .from(ARTIFACTS)
                .where(ARTIFACTS.FOLDER_ID.eq(ARTIFACT_FOLDERS.ID))
                .and(ARTIFACTS.DELETED_AT.isNull())
                .asField("artifact_count");
        Field<Integer> folderCount = DSL.selectCount()
                .from(child)
                .where(child.PARENT_ID.eq(ARTIFACT_FOLDERS.ID))
                .asField("folder_count");

        return dslContext
                .select(
                        ARTIFACT_FOLDERS.ID,
                        ARTIFACT_FOLDERS.NAME,
                        ARTIFACT_FOLDERS.PARENT_ID,
                        artifactCount,
                        folderCount,
                        ARTIFACT_FOLDERS.CREATED_AT,
                        ARTIFACT_FOLDERS.UPDATED_AT)
                .from(ARTIFACT_FOLDERS)
                .where(ArtifactScopeCondition.matches(
                        projectId, ARTIFACT_FOLDERS.PROJECT_ID, ARTIFACT_FOLDERS.OWNER_ID))
                .orderBy(ARTIFACT_FOLDERS.NAME.asc(), ARTIFACT_FOLDERS.ID.asc())
                .fetch(record -> new FolderSummary(
                        record.get(ARTIFACT_FOLDERS.ID),
                        record.get(ARTIFACT_FOLDERS.NAME),
                        record.get(ARTIFACT_FOLDERS.PARENT_ID),
                        record.get(artifactCount),
                        record.get(folderCount),
                        record.get(ARTIFACT_FOLDERS.CREATED_AT),
                        record.get(ARTIFACT_FOLDERS.UPDATED_AT)));
    }

    @Override
    public Optional<ArtifactView> findOne(ArtifactScope projectId, String artifactId) {
        var editor = USERS.as("editor");
        return dslContext
                .select(
                        ARTIFACTS.ID,
                        ARTIFACTS.TITLE,
                        ARTIFACTS.FOLDER_ID,
                        ARTIFACTS.CREATED_AT,
                        ARTIFACTS.UPDATED_AT,
                        ARTIFACT_REVISIONS.BODY,
                        ARTIFACT_REVISIONS.REVISION_NO,
                        USERS.NICKNAME,
                        editor.NICKNAME)
                .from(ARTIFACTS)
                .join(ARTIFACT_REVISIONS)
                .on(ARTIFACT_REVISIONS.ID.eq(ARTIFACTS.HEAD_REVISION_ID))
                .leftJoin(USERS)
                .on(USERS.ID.eq(ARTIFACTS.CREATED_BY))
                .leftJoin(editor)
                .on(editor.ID.eq(ARTIFACTS.UPDATED_BY))
                .where(ARTIFACTS.ID.eq(artifactId))
                .and(ArtifactScopeCondition.matches(projectId, ARTIFACTS.PROJECT_ID, ARTIFACTS.OWNER_ID))
                .and(ARTIFACTS.DELETED_AT.isNull())
                .fetchOptional()
                .map(record -> new ArtifactView(
                        new ArtifactSummary(
                                record.get(ARTIFACTS.ID),
                                record.get(ARTIFACTS.TITLE),
                                record.get(ARTIFACTS.FOLDER_ID),
                                record.get(ARTIFACTS.CREATED_AT),
                                record.get(ARTIFACTS.UPDATED_AT)),
                        record.get(ARTIFACT_REVISIONS.BODY),
                        record.get(ARTIFACT_REVISIONS.REVISION_NO),
                        record.get(USERS.NICKNAME) == null ? "" : record.get(USERS.NICKNAME),
                        record.get(editor.NICKNAME) == null ? "" : record.get(editor.NICKNAME)));
    }

    @Override
    public List<VersionSummary> findRevisions(ArtifactScope projectId, String artifactId, int limit, int offset) {
        return dslContext
                .select(
                        ARTIFACT_REVISIONS.REVISION_NO,
                        ARTIFACT_REVISIONS.CREATED_AT,
                        USERS.NICKNAME,
                        ARTIFACT_REVISIONS.COMMENT)
                .from(ARTIFACT_REVISIONS)
                .join(ARTIFACTS)
                .on(ARTIFACTS.ID.eq(ARTIFACT_REVISIONS.ARTIFACT_ID))
                .leftJoin(USERS)
                .on(USERS.ID.eq(ARTIFACT_REVISIONS.CREATED_BY))
                .where(livingArtifact(projectId, artifactId))
                .orderBy(ARTIFACT_REVISIONS.REVISION_NO.desc())
                .limit(limit)
                .offset(offset)
                .fetch(JooqArtifactQuery::toVersionSummary);
    }

    @Override
    public long countRevisions(ArtifactScope projectId, String artifactId) {
        return dslContext
                .selectCount()
                .from(ARTIFACT_REVISIONS)
                .join(ARTIFACTS)
                .on(ARTIFACTS.ID.eq(ARTIFACT_REVISIONS.ARTIFACT_ID))
                .where(livingArtifact(projectId, artifactId))
                .fetchSingle()
                .value1();
    }

    @Override
    public Optional<VersionView> findRevision(ArtifactScope projectId, String artifactId, int revisionNo) {
        return dslContext
                .select(
                        ARTIFACT_REVISIONS.REVISION_NO,
                        ARTIFACT_REVISIONS.CREATED_AT,
                        USERS.NICKNAME,
                        ARTIFACT_REVISIONS.COMMENT,
                        ARTIFACT_REVISIONS.TITLE,
                        ARTIFACT_REVISIONS.BODY)
                .from(ARTIFACT_REVISIONS)
                .join(ARTIFACTS)
                .on(ARTIFACTS.ID.eq(ARTIFACT_REVISIONS.ARTIFACT_ID))
                .leftJoin(USERS)
                .on(USERS.ID.eq(ARTIFACT_REVISIONS.CREATED_BY))
                .where(livingArtifact(projectId, artifactId))
                .and(ARTIFACT_REVISIONS.REVISION_NO.eq(revisionNo))
                .fetchOptional()
                .map(record -> new VersionView(
                        toVersionSummary(record),
                        record.get(ARTIFACT_REVISIONS.TITLE),
                        record.get(ARTIFACT_REVISIONS.BODY)));
    }

    /** 타 프로젝트 아티팩트 또는 논리 삭제된 아티팩트의 개정 이력 조회를 차단한다(DOC-004 A4, A5). */
    private static Condition livingArtifact(ArtifactScope projectId, String artifactId) {
        return ARTIFACTS
                .ID
                .eq(artifactId)
                .and(ArtifactScopeCondition.matches(projectId, ARTIFACTS.PROJECT_ID, ARTIFACTS.OWNER_ID))
                .and(ARTIFACTS.DELETED_AT.isNull());
    }

    private static VersionSummary toVersionSummary(Record record) {
        String nickname = record.get(USERS.NICKNAME);
        return new VersionSummary(
                record.get(ARTIFACT_REVISIONS.REVISION_NO),
                record.get(ARTIFACT_REVISIONS.CREATED_AT),
                nickname == null ? "" : nickname,
                record.get(ARTIFACT_REVISIONS.COMMENT));
    }

    private static ArtifactSummary toSummary(Record5<String, String, String, Instant, Instant> record) {
        return new ArtifactSummary(
                record.get(ARTIFACTS.ID),
                record.get(ARTIFACTS.TITLE),
                record.get(ARTIFACTS.FOLDER_ID),
                record.get(ARTIFACTS.CREATED_AT),
                record.get(ARTIFACTS.UPDATED_AT));
    }
}
