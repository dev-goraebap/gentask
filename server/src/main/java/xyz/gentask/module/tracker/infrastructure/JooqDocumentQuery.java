package xyz.gentask.module.tracker.infrastructure;

import static xyz.gentask.jooq.Tables.DOCUMENTS;
import static xyz.gentask.jooq.Tables.DOCUMENT_REVISIONS;
import static xyz.gentask.jooq.Tables.USERS;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Record4;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.tracker.application.doc.DocumentQuery;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentSummary;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentView;

/**
 * 문서의 목록과 상세를 낸다.
 *
 * <p>목록은 개정을 잇지 않는다. 제목과 고친 때를 문서가 앞당겨 들고 있기 때문이다. 상세만 지금 참인
 * 개정을 이어 본문과 개정 번호를 싣는다.
 *
 * <p>지워진 문서는 두 자리 모두에서 걸러 낸다(DOC-002 A3).
 */
@Repository
@RequiredArgsConstructor
class JooqDocumentQuery implements DocumentQuery {

    private final DSLContext dslContext;

    @Override
    public List<DocumentSummary> findAll(UUID projectId) {
        return dslContext
                .select(DOCUMENTS.ID, DOCUMENTS.TITLE, DOCUMENTS.CREATED_AT, DOCUMENTS.UPDATED_AT)
                .from(DOCUMENTS)
                .where(DOCUMENTS.PROJECT_ID.eq(projectId))
                .and(DOCUMENTS.DELETED_AT.isNull())
                .orderBy(DOCUMENTS.UPDATED_AT.desc(), DOCUMENTS.ID.asc())
                .fetch(JooqDocumentQuery::toSummary);
    }

    @Override
    public Optional<DocumentView> findOne(UUID projectId, UUID documentId) {
        return dslContext
                .select(
                        DOCUMENTS.ID,
                        DOCUMENTS.TITLE,
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
                                record.get(DOCUMENTS.CREATED_AT),
                                record.get(DOCUMENTS.UPDATED_AT)),
                        record.get(DOCUMENT_REVISIONS.BODY),
                        record.get(DOCUMENT_REVISIONS.REVISION_NO),
                        record.get(USERS.NICKNAME) == null ? "" : record.get(USERS.NICKNAME)));
    }

    private static DocumentSummary toSummary(Record4<UUID, String, Instant, Instant> record) {
        return new DocumentSummary(
                record.get(DOCUMENTS.ID),
                record.get(DOCUMENTS.TITLE),
                record.get(DOCUMENTS.CREATED_AT),
                record.get(DOCUMENTS.UPDATED_AT));
    }
}
