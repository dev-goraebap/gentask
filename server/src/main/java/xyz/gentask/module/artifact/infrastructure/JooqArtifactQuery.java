package xyz.gentask.module.artifact.infrastructure;

import static xyz.gentask.jooq.Tables.ARTIFACTS;
import static xyz.gentask.jooq.Tables.ARTIFACT_FOLDERS;
import static xyz.gentask.jooq.Tables.ARTIFACT_REVISIONS;
import static xyz.gentask.jooq.Tables.USERS;

import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
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
        return summaries(ArtifactScopeCondition.matches(projectId, ARTIFACTS.PROJECT_ID, ARTIFACTS.OWNER_ID));
    }

    @Override
    public List<ArtifactSummary> findVisible(java.util.UUID userId) {
        return summaries(visible(userId, ARTIFACTS.PROJECT_ID, ARTIFACTS.OWNER_ID));
    }

    private List<ArtifactSummary> summaries(Condition condition) {
        return dslContext
                .select(
                        ARTIFACTS.ID,
                        ARTIFACTS.TITLE,
                        ARTIFACTS.FOLDER_ID,
                        ARTIFACTS.CREATED_AT,
                        ARTIFACTS.UPDATED_AT,
                        ARTIFACTS.PROJECT_ID)
                .from(ARTIFACTS)
                .where(condition)
                .and(ARTIFACTS.DELETED_AT.isNull())
                .orderBy(ARTIFACTS.UPDATED_AT.desc(), ARTIFACTS.ID.asc())
                .fetch(JooqArtifactQuery::toSummary);
    }

    /*
     * 폴더별 하위 아티팩트 및 자식 폴더 수를 집계한다(DOC-008 A7).
     */
    @Override
    public List<FolderSummary> findFolders(ArtifactScope projectId) {
        return folders(
                ArtifactScopeCondition.matches(projectId, ARTIFACT_FOLDERS.PROJECT_ID, ARTIFACT_FOLDERS.OWNER_ID));
    }

    @Override
    public List<FolderSummary> findVisibleFolders(java.util.UUID userId) {
        return folders(visible(userId, ARTIFACT_FOLDERS.PROJECT_ID, ARTIFACT_FOLDERS.OWNER_ID));
    }

    private List<FolderSummary> folders(Condition condition) {
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
                        ARTIFACT_FOLDERS.UPDATED_AT,
                        ARTIFACT_FOLDERS.PROJECT_ID)
                .from(ARTIFACT_FOLDERS)
                .where(condition)
                .orderBy(ARTIFACT_FOLDERS.NAME.asc(), ARTIFACT_FOLDERS.ID.asc())
                .fetch(record -> new FolderSummary(
                        record.get(ARTIFACT_FOLDERS.ID),
                        record.get(ARTIFACT_FOLDERS.NAME),
                        record.get(ARTIFACT_FOLDERS.PARENT_ID),
                        record.get(artifactCount),
                        record.get(folderCount),
                        record.get(ARTIFACT_FOLDERS.CREATED_AT),
                        record.get(ARTIFACT_FOLDERS.UPDATED_AT),
                        record.get(ARTIFACT_FOLDERS.PROJECT_ID)));
    }

    @Override
    public Optional<ArtifactView> findOne(ArtifactScope projectId, String artifactId) {
        var editor = USERS.as("editor");
        return dslContext
                .select(
                        ARTIFACTS.ID,
                        ARTIFACTS.PROJECT_ID,
                        ARTIFACTS.TITLE,
                        ARTIFACTS.FOLDER_ID,
                        ARTIFACTS.CREATED_AT,
                        ARTIFACTS.UPDATED_AT,
                        ARTIFACT_REVISIONS.EDITOR_STATE,
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
                                record.get(ARTIFACTS.UPDATED_AT),
                                record.get(ARTIFACTS.PROJECT_ID)),
                        record.get(ARTIFACT_REVISIONS.BODY),
                        record.get(ARTIFACT_REVISIONS.REVISION_NO),
                        record.get(USERS.NICKNAME) == null ? "" : record.get(USERS.NICKNAME),
                        record.get(editor.NICKNAME) == null ? "" : record.get(editor.NICKNAME),
                        record.get(ARTIFACT_REVISIONS.EDITOR_STATE)));
    }

    @Override
    public List<VersionSummary> findRevisions(ArtifactScope projectId, String artifactId, int limit, int offset) {
        return dslContext
                .select(
                        ARTIFACT_REVISIONS.REVISION_NO,
                        ARTIFACT_REVISIONS.CREATED_AT,
                        ARTIFACT_REVISIONS.CREATED_BY,
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
                        ARTIFACT_REVISIONS.CREATED_BY,
                        USERS.NICKNAME,
                        ARTIFACT_REVISIONS.COMMENT,
                        ARTIFACT_REVISIONS.TITLE,
                        ARTIFACT_REVISIONS.BODY,
                        ARTIFACT_REVISIONS.EDITOR_STATE)
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
                        record.get(ARTIFACT_REVISIONS.BODY),
                        record.get(ARTIFACT_REVISIONS.EDITOR_STATE)));
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
                record.get(ARTIFACT_REVISIONS.COMMENT),
                record.get(ARTIFACT_REVISIONS.CREATED_BY));
    }

    private static ArtifactSummary toSummary(Record record) {
        return new ArtifactSummary(
                record.get(ARTIFACTS.ID),
                record.get(ARTIFACTS.TITLE),
                record.get(ARTIFACTS.FOLDER_ID),
                record.get(ARTIFACTS.CREATED_AT),
                record.get(ARTIFACTS.UPDATED_AT),
                record.get(ARTIFACTS.PROJECT_ID));
    }

    private Condition visible(java.util.UUID userId, Field<String> projectId, Field<java.util.UUID> ownerId) {
        var projects = xyz.gentask.jooq.Tables.PROJECTS;
        var members = xyz.gentask.jooq.Tables.PROJECT_MEMBERS;
        return projectId
                .isNull()
                .and(ownerId.eq(userId))
                .or(projectId.in(DSL.select(projects.ID)
                        .from(projects)
                        .where(projects.OWNER_ID
                                .eq(userId)
                                .or(DSL.exists(DSL.selectOne()
                                        .from(members)
                                        .where(members.PROJECT_ID.eq(projects.ID))
                                        .and(members.USER_ID.eq(userId)))))));
    }

    @Override
    public Optional<ArtifactScope> artifactScope(String id) {
        return dslContext
                .select(ARTIFACTS.PROJECT_ID, ARTIFACTS.OWNER_ID)
                .from(ARTIFACTS)
                .where(ARTIFACTS.ID.eq(id))
                .and(ARTIFACTS.DELETED_AT.isNull())
                .fetchOptional(r -> new ArtifactScope(r.value1(), r.value2()));
    }

    @Override
    public Optional<ArtifactScope> folderScope(String id) {
        return dslContext
                .select(ARTIFACT_FOLDERS.PROJECT_ID, ARTIFACT_FOLDERS.OWNER_ID)
                .from(ARTIFACT_FOLDERS)
                .where(ARTIFACT_FOLDERS.ID.eq(id))
                .fetchOptional(r -> new ArtifactScope(r.value1(), r.value2()));
    }
}
