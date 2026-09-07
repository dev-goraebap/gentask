package xyz.gentask.module.artifact.infrastructure;

import static xyz.gentask.jooq.Tables.ARTIFACT_FOLDERS;

import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.ArtifactFoldersRecord;
import xyz.gentask.module.artifact.domain.folder.ArtifactFolder;
import xyz.gentask.module.artifact.domain.folder.ArtifactFolderName;
import xyz.gentask.module.artifact.domain.folder.ArtifactFolderRepository;

@Repository
@RequiredArgsConstructor
class JooqArtifactFolderRepository implements ArtifactFolderRepository {

    private final DSLContext dslContext;

    @Override
    public boolean insert(ArtifactFolder folder) {
        return dslContext
                        .insertInto(ARTIFACT_FOLDERS)
                        .set(ARTIFACT_FOLDERS.ID, folder.id())
                        .set(ARTIFACT_FOLDERS.PROJECT_ID, folder.projectId())
                        .set(ARTIFACT_FOLDERS.NAME, folder.name().value())
                        .set(ARTIFACT_FOLDERS.PARENT_ID, folder.parentId())
                        .set(ARTIFACT_FOLDERS.CREATED_AT, folder.createdAt())
                        .set(ARTIFACT_FOLDERS.CREATED_BY, folder.createdBy())
                        .set(ARTIFACT_FOLDERS.UPDATED_AT, folder.updatedAt())
                        .set(ARTIFACT_FOLDERS.UPDATED_BY, folder.updatedBy())
                        .onConflict(ARTIFACT_FOLDERS.ID)
                        .doNothing()
                        .execute()
                == 1;
    }

    @Override
    public void save(ArtifactFolder folder) {
        dslContext
                .insertInto(ARTIFACT_FOLDERS)
                .set(ARTIFACT_FOLDERS.ID, folder.id())
                .set(ARTIFACT_FOLDERS.PROJECT_ID, folder.projectId())
                .set(ARTIFACT_FOLDERS.NAME, folder.name().value())
                .set(ARTIFACT_FOLDERS.PARENT_ID, folder.parentId())
                .set(ARTIFACT_FOLDERS.CREATED_AT, folder.createdAt())
                .set(ARTIFACT_FOLDERS.CREATED_BY, folder.createdBy())
                .set(ARTIFACT_FOLDERS.UPDATED_AT, folder.updatedAt())
                .set(ARTIFACT_FOLDERS.UPDATED_BY, folder.updatedBy())
                .onConflict(ARTIFACT_FOLDERS.ID)
                .doUpdate()
                .set(ARTIFACT_FOLDERS.NAME, folder.name().value())
                .set(ARTIFACT_FOLDERS.PARENT_ID, folder.parentId())
                .set(ARTIFACT_FOLDERS.UPDATED_AT, folder.updatedAt())
                .set(ARTIFACT_FOLDERS.UPDATED_BY, folder.updatedBy())
                .execute();
    }

    @Override
    public Optional<ArtifactFolder> findById(String projectId, String folderId) {
        return dslContext
                .selectFrom(ARTIFACT_FOLDERS)
                .where(ARTIFACT_FOLDERS.ID.eq(folderId))
                .and(ARTIFACT_FOLDERS.PROJECT_ID.eq(projectId))
                .fetchOptional()
                .map(JooqArtifactFolderRepository::toDomain);
    }

    @Override
    public List<ArtifactFolder> findChildren(String parentId) {
        return dslContext
                .selectFrom(ARTIFACT_FOLDERS)
                .where(ARTIFACT_FOLDERS.PARENT_ID.eq(parentId))
                .fetch(JooqArtifactFolderRepository::toDomain);
    }

    @Override
    public void deleteById(String folderId) {
        dslContext
                .deleteFrom(ARTIFACT_FOLDERS)
                .where(ARTIFACT_FOLDERS.ID.eq(folderId))
                .execute();
    }

    private static ArtifactFolder toDomain(ArtifactFoldersRecord artifactFoldersRecord) {
        return ArtifactFolder.restore(
                artifactFoldersRecord.getId(),
                artifactFoldersRecord.getProjectId(),
                ArtifactFolderName.of(artifactFoldersRecord.getName()),
                artifactFoldersRecord.getParentId(),
                artifactFoldersRecord.getCreatedAt(),
                artifactFoldersRecord.getCreatedBy(),
                artifactFoldersRecord.getUpdatedAt(),
                artifactFoldersRecord.getUpdatedBy());
    }
}
