package xyz.gentask.module.tracker.infrastructure;

import static xyz.gentask.jooq.Tables.DOCUMENT_FOLDERS;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.DocumentFoldersRecord;
import xyz.gentask.module.tracker.domain.doc.DocumentFolder;
import xyz.gentask.module.tracker.domain.doc.DocumentFolderName;
import xyz.gentask.module.tracker.domain.doc.DocumentFolderRepository;

@Repository
@RequiredArgsConstructor
class JooqDocumentFolderRepository implements DocumentFolderRepository {

    private final DSLContext dslContext;

    @Override
    public void save(DocumentFolder folder) {
        dslContext
                .insertInto(DOCUMENT_FOLDERS)
                .set(DOCUMENT_FOLDERS.ID, folder.id())
                .set(DOCUMENT_FOLDERS.PROJECT_ID, folder.projectId())
                .set(DOCUMENT_FOLDERS.NAME, folder.name().value())
                .set(DOCUMENT_FOLDERS.PARENT_ID, folder.parentId())
                .set(DOCUMENT_FOLDERS.CREATED_AT, folder.createdAt())
                .set(DOCUMENT_FOLDERS.CREATED_BY, folder.createdBy())
                .set(DOCUMENT_FOLDERS.UPDATED_AT, folder.updatedAt())
                .set(DOCUMENT_FOLDERS.UPDATED_BY, folder.updatedBy())
                .onConflict(DOCUMENT_FOLDERS.ID)
                .doUpdate()
                .set(DOCUMENT_FOLDERS.NAME, folder.name().value())
                .set(DOCUMENT_FOLDERS.PARENT_ID, folder.parentId())
                .set(DOCUMENT_FOLDERS.UPDATED_AT, folder.updatedAt())
                .set(DOCUMENT_FOLDERS.UPDATED_BY, folder.updatedBy())
                .execute();
    }

    @Override
    public Optional<DocumentFolder> findById(UUID projectId, UUID folderId) {
        return dslContext
                .selectFrom(DOCUMENT_FOLDERS)
                .where(DOCUMENT_FOLDERS.ID.eq(folderId))
                .and(DOCUMENT_FOLDERS.PROJECT_ID.eq(projectId))
                .fetchOptional()
                .map(JooqDocumentFolderRepository::toDomain);
    }

    @Override
    public List<DocumentFolder> findChildren(UUID parentId) {
        return dslContext
                .selectFrom(DOCUMENT_FOLDERS)
                .where(DOCUMENT_FOLDERS.PARENT_ID.eq(parentId))
                .fetch(JooqDocumentFolderRepository::toDomain);
    }

    @Override
    public void deleteById(UUID folderId) {
        dslContext
                .deleteFrom(DOCUMENT_FOLDERS)
                .where(DOCUMENT_FOLDERS.ID.eq(folderId))
                .execute();
    }

    private static DocumentFolder toDomain(DocumentFoldersRecord documentFoldersRecord) {
        return DocumentFolder.restore(
                documentFoldersRecord.getId(),
                documentFoldersRecord.getProjectId(),
                DocumentFolderName.of(documentFoldersRecord.getName()),
                documentFoldersRecord.getParentId(),
                documentFoldersRecord.getCreatedAt(),
                documentFoldersRecord.getCreatedBy(),
                documentFoldersRecord.getUpdatedAt(),
                documentFoldersRecord.getUpdatedBy());
    }
}
