package xyz.gentask.module.tracker.infrastructure;

import static xyz.gentask.jooq.Tables.DOCUMENTS;
import static xyz.gentask.jooq.Tables.DOCUMENT_REVISIONS;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.DocumentRevisionsRecord;
import xyz.gentask.jooq.tables.records.DocumentsRecord;
import xyz.gentask.module.tracker.domain.doc.Document;
import xyz.gentask.module.tracker.domain.doc.DocumentBody;
import xyz.gentask.module.tracker.domain.doc.DocumentRepository;
import xyz.gentask.module.tracker.domain.doc.DocumentRevision;
import xyz.gentask.module.tracker.domain.doc.DocumentTitle;
import xyz.gentask.module.tracker.domain.doc.RevisionComment;

@Repository
@RequiredArgsConstructor
class JooqDocumentRepository implements DocumentRepository {

    private final DSLContext dslContext;

    @Override
    public void save(Document document) {
        dslContext
                .insertInto(DOCUMENTS)
                .set(DOCUMENTS.ID, document.id())
                .set(DOCUMENTS.PROJECT_ID, document.projectId())
                .set(DOCUMENTS.TITLE, document.title().value())
                .set(DOCUMENTS.HEAD_REVISION_ID, document.headRevisionId())
                .set(DOCUMENTS.DELETED_AT, document.deletedAt())
                .set(DOCUMENTS.DELETED_BY, document.deletedBy())
                .set(DOCUMENTS.CREATED_AT, document.createdAt())
                .set(DOCUMENTS.CREATED_BY, document.createdBy())
                .set(DOCUMENTS.UPDATED_AT, document.updatedAt())
                .set(DOCUMENTS.UPDATED_BY, document.updatedBy())
                .onConflict(DOCUMENTS.ID)
                .doUpdate()
                .set(DOCUMENTS.TITLE, document.title().value())
                .set(DOCUMENTS.HEAD_REVISION_ID, document.headRevisionId())
                .set(DOCUMENTS.DELETED_AT, document.deletedAt())
                .set(DOCUMENTS.DELETED_BY, document.deletedBy())
                .set(DOCUMENTS.UPDATED_AT, document.updatedAt())
                .set(DOCUMENTS.UPDATED_BY, document.updatedBy())
                .execute();
    }

    @Override
    public Optional<Document> findById(UUID projectId, UUID documentId) {
        return dslContext
                .selectFrom(DOCUMENTS)
                .where(DOCUMENTS.ID.eq(documentId))
                .and(DOCUMENTS.PROJECT_ID.eq(projectId))
                .and(DOCUMENTS.DELETED_AT.isNull())
                .fetchOptional()
                .map(JooqDocumentRepository::toDomain);
    }

    @Override
    public void append(DocumentRevision revision) {
        dslContext
                .insertInto(DOCUMENT_REVISIONS)
                .set(DOCUMENT_REVISIONS.ID, revision.id())
                .set(DOCUMENT_REVISIONS.DOCUMENT_ID, revision.documentId())
                .set(DOCUMENT_REVISIONS.REVISION_NO, revision.revisionNo())
                .set(DOCUMENT_REVISIONS.TITLE, revision.title().value())
                .set(DOCUMENT_REVISIONS.BODY, revision.body().value())
                .set(DOCUMENT_REVISIONS.CONTENT_SHA1, revision.contentSha1())
                .set(DOCUMENT_REVISIONS.COMMENT, revision.comment().orNull())
                .set(DOCUMENT_REVISIONS.CREATED_AT, revision.createdAt())
                .set(DOCUMENT_REVISIONS.CREATED_BY, revision.createdBy())
                .execute();
    }

    @Override
    public Optional<DocumentRevision> findRevisionById(UUID revisionId) {
        return dslContext
                .selectFrom(DOCUMENT_REVISIONS)
                .where(DOCUMENT_REVISIONS.ID.eq(revisionId))
                .fetchOptional()
                .map(JooqDocumentRepository::toDomain);
    }

    private static Document toDomain(DocumentsRecord documentsRecord) {
        return Document.restore(
                documentsRecord.getId(),
                documentsRecord.getProjectId(),
                DocumentTitle.of(documentsRecord.getTitle()),
                documentsRecord.getHeadRevisionId(),
                documentsRecord.getDeletedAt(),
                documentsRecord.getDeletedBy(),
                documentsRecord.getCreatedAt(),
                documentsRecord.getCreatedBy(),
                documentsRecord.getUpdatedAt(),
                documentsRecord.getUpdatedBy());
    }

    private static DocumentRevision toDomain(DocumentRevisionsRecord documentRevisionsRecord) {
        return DocumentRevision.restore(
                documentRevisionsRecord.getId(),
                documentRevisionsRecord.getDocumentId(),
                documentRevisionsRecord.getRevisionNo(),
                DocumentTitle.of(documentRevisionsRecord.getTitle()),
                DocumentBody.of(documentRevisionsRecord.getBody()),
                documentRevisionsRecord.getContentSha1(),
                RevisionComment.of(documentRevisionsRecord.getComment()),
                documentRevisionsRecord.getCreatedAt(),
                documentRevisionsRecord.getCreatedBy());
    }
}
