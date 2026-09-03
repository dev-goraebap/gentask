package xyz.gentask.module.tracker.infrastructure;

import static xyz.gentask.jooq.Tables.DOCUMENTS;
import static xyz.gentask.jooq.Tables.DOCUMENT_FOLDERS;
import static xyz.gentask.jooq.Tables.DOCUMENT_REVISIONS;
import static xyz.gentask.jooq.Tables.USERS;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.Record5;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.DocumentFolders;
import xyz.gentask.module.tracker.application.doc.DocumentQuery;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentSummary;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentView;
import xyz.gentask.module.tracker.application.doc.DocumentViews.FolderSummary;
import xyz.gentask.module.tracker.application.doc.DocumentViews.RevisionSummary;
import xyz.gentask.module.tracker.application.doc.DocumentViews.RevisionView;

/**
 * 문서 목록 및 상세 조회를 담당하는 jOOQ 쿼리 구현체다.
 */
@Repository
@RequiredArgsConstructor
class JooqDocumentQuery implements DocumentQuery {

    private final DSLContext dslContext;

    @Override
    public List<DocumentSummary> findAll(UUID projectId) {
        return dslContext
                .select(DOCUMENTS.ID, DOCUMENTS.TITLE, DOCUMENTS.FOLDER_ID, DOCUMENTS.CREATED_AT, DOCUMENTS.UPDATED_AT)
                .from(DOCUMENTS)
                .where(DOCUMENTS.PROJECT_ID.eq(projectId))
                .and(DOCUMENTS.DELETED_AT.isNull())
                .orderBy(DOCUMENTS.UPDATED_AT.desc(), DOCUMENTS.ID.asc())
                .fetch(JooqDocumentQuery::toSummary);
    }

    /*
     * 폴더별 하위 문서 및 자식 폴더 수를 집계한다(DOC-008 A7).
     */
    @Override
    public List<FolderSummary> findFolders(UUID projectId) {
        DocumentFolders child = DOCUMENT_FOLDERS.as("child");
        Field<Integer> documentCount = DSL.selectCount()
                .from(DOCUMENTS)
                .where(DOCUMENTS.FOLDER_ID.eq(DOCUMENT_FOLDERS.ID))
                .and(DOCUMENTS.DELETED_AT.isNull())
                .asField("document_count");
        Field<Integer> folderCount = DSL.selectCount()
                .from(child)
                .where(child.PARENT_ID.eq(DOCUMENT_FOLDERS.ID))
                .asField("folder_count");

        return dslContext
                .select(
                        DOCUMENT_FOLDERS.ID,
                        DOCUMENT_FOLDERS.NAME,
                        DOCUMENT_FOLDERS.PARENT_ID,
                        documentCount,
                        folderCount,
                        DOCUMENT_FOLDERS.CREATED_AT,
                        DOCUMENT_FOLDERS.UPDATED_AT)
                .from(DOCUMENT_FOLDERS)
                .where(DOCUMENT_FOLDERS.PROJECT_ID.eq(projectId))
                .orderBy(DOCUMENT_FOLDERS.NAME.asc(), DOCUMENT_FOLDERS.ID.asc())
                .fetch(record -> new FolderSummary(
                        record.get(DOCUMENT_FOLDERS.ID),
                        record.get(DOCUMENT_FOLDERS.NAME),
                        record.get(DOCUMENT_FOLDERS.PARENT_ID),
                        record.get(documentCount),
                        record.get(folderCount),
                        record.get(DOCUMENT_FOLDERS.CREATED_AT),
                        record.get(DOCUMENT_FOLDERS.UPDATED_AT)));
    }

    @Override
    public Optional<DocumentView> findOne(UUID projectId, UUID documentId) {
        return dslContext
                .select(
                        DOCUMENTS.ID,
                        DOCUMENTS.TITLE,
                        DOCUMENTS.FOLDER_ID,
                        DOCUMENTS.CREATED_AT,
                        DOCUMENTS.UPDATED_AT,
                        DOCUMENT_REVISIONS.BODY,
                        DOCUMENT_REVISIONS.REVISION_NO,
                        USERS.NICKNAME)
                .from(DOCUMENTS)
                .join(DOCUMENT_REVISIONS)
                .on(DOCUMENT_REVISIONS.ID.eq(DOCUMENTS.HEAD_REVISION_ID))
                .leftJoin(USERS)
                .on(USERS.ID.eq(DOCUMENTS.CREATED_BY))
                .where(DOCUMENTS.ID.eq(documentId))
                .and(DOCUMENTS.PROJECT_ID.eq(projectId))
                .and(DOCUMENTS.DELETED_AT.isNull())
                .fetchOptional()
                .map(record -> new DocumentView(
                        new DocumentSummary(
                                record.get(DOCUMENTS.ID),
                                record.get(DOCUMENTS.TITLE),
                                record.get(DOCUMENTS.FOLDER_ID),
                                record.get(DOCUMENTS.CREATED_AT),
                                record.get(DOCUMENTS.UPDATED_AT)),
                        record.get(DOCUMENT_REVISIONS.BODY),
                        record.get(DOCUMENT_REVISIONS.REVISION_NO),
                        record.get(USERS.NICKNAME) == null ? "" : record.get(USERS.NICKNAME)));
    }

    @Override
    public List<RevisionSummary> findRevisions(UUID projectId, UUID documentId, int limit, int offset) {
        return dslContext
                .select(
                        DOCUMENT_REVISIONS.REVISION_NO,
                        DOCUMENT_REVISIONS.CREATED_AT,
                        USERS.NICKNAME,
                        DOCUMENT_REVISIONS.COMMENT)
                .from(DOCUMENT_REVISIONS)
                .join(DOCUMENTS)
                .on(DOCUMENTS.ID.eq(DOCUMENT_REVISIONS.DOCUMENT_ID))
                .leftJoin(USERS)
                .on(USERS.ID.eq(DOCUMENT_REVISIONS.CREATED_BY))
                .where(livingDocument(projectId, documentId))
                .orderBy(DOCUMENT_REVISIONS.REVISION_NO.desc())
                .limit(limit)
                .offset(offset)
                .fetch(JooqDocumentQuery::toRevisionSummary);
    }

    @Override
    public long countRevisions(UUID projectId, UUID documentId) {
        return dslContext
                .selectCount()
                .from(DOCUMENT_REVISIONS)
                .join(DOCUMENTS)
                .on(DOCUMENTS.ID.eq(DOCUMENT_REVISIONS.DOCUMENT_ID))
                .where(livingDocument(projectId, documentId))
                .fetchSingle()
                .value1();
    }

    @Override
    public Optional<RevisionView> findRevision(UUID projectId, UUID documentId, int revisionNo) {
        return dslContext
                .select(
                        DOCUMENT_REVISIONS.REVISION_NO,
                        DOCUMENT_REVISIONS.CREATED_AT,
                        USERS.NICKNAME,
                        DOCUMENT_REVISIONS.COMMENT,
                        DOCUMENT_REVISIONS.TITLE,
                        DOCUMENT_REVISIONS.BODY)
                .from(DOCUMENT_REVISIONS)
                .join(DOCUMENTS)
                .on(DOCUMENTS.ID.eq(DOCUMENT_REVISIONS.DOCUMENT_ID))
                .leftJoin(USERS)
                .on(USERS.ID.eq(DOCUMENT_REVISIONS.CREATED_BY))
                .where(livingDocument(projectId, documentId))
                .and(DOCUMENT_REVISIONS.REVISION_NO.eq(revisionNo))
                .fetchOptional()
                .map(record -> new RevisionView(
                        toRevisionSummary(record),
                        record.get(DOCUMENT_REVISIONS.TITLE),
                        record.get(DOCUMENT_REVISIONS.BODY)));
    }

    /** 타 프로젝트 문서 또는 논리 삭제된 문서의 개정 이력 조회를 차단한다(DOC-004 A4, A5). */
    private static Condition livingDocument(UUID projectId, UUID documentId) {
        return DOCUMENTS
                .ID
                .eq(documentId)
                .and(DOCUMENTS.PROJECT_ID.eq(projectId))
                .and(DOCUMENTS.DELETED_AT.isNull());
    }

    private static RevisionSummary toRevisionSummary(Record record) {
        String nickname = record.get(USERS.NICKNAME);
        return new RevisionSummary(
                record.get(DOCUMENT_REVISIONS.REVISION_NO),
                record.get(DOCUMENT_REVISIONS.CREATED_AT),
                nickname == null ? "" : nickname,
                record.get(DOCUMENT_REVISIONS.COMMENT));
    }

    private static DocumentSummary toSummary(Record5<UUID, String, UUID, Instant, Instant> record) {
        return new DocumentSummary(
                record.get(DOCUMENTS.ID),
                record.get(DOCUMENTS.TITLE),
                record.get(DOCUMENTS.FOLDER_ID),
                record.get(DOCUMENTS.CREATED_AT),
                record.get(DOCUMENTS.UPDATED_AT));
    }
}
