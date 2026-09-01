package xyz.gentask.module.tracker.infrastructure;

import static xyz.gentask.jooq.Tables.PROJECTS;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.ProjectsRecord;
import xyz.gentask.module.tracker.domain.project.Project;
import xyz.gentask.module.tracker.domain.project.ProjectKey;
import xyz.gentask.module.tracker.domain.project.ProjectName;
import xyz.gentask.module.tracker.domain.project.ProjectRepository;

@Repository
@RequiredArgsConstructor
class JooqProjectRepository implements ProjectRepository {

    private final DSLContext dslContext;

    @Override
    public void save(Project project) {
        dslContext
                .insertInto(PROJECTS)
                .set(PROJECTS.ID, project.id())
                .set(PROJECTS.OWNER_ID, project.ownerId())
                .set(PROJECTS.NAME, project.name().value())
                .set(PROJECTS.KEY, project.key().value())
                .set(PROJECTS.NEXT_NUMBER, project.nextNumber())
                .set(PROJECTS.CREATED_AT, project.createdAt())
                .set(PROJECTS.UPDATED_AT, project.updatedAt())
                .onConflict(PROJECTS.ID)
                .doUpdate()
                .set(PROJECTS.NAME, project.name().value())
                .set(PROJECTS.NEXT_NUMBER, project.nextNumber())
                .set(PROJECTS.UPDATED_AT, project.updatedAt())
                .execute();
    }

    @Override
    public Optional<Project> findById(UUID projectId) {
        return dslContext
                .selectFrom(PROJECTS)
                .where(PROJECTS.ID.eq(projectId))
                .fetchOptional()
                .map(JooqProjectRepository::toDomain);
    }

    @Override
    public List<ProjectKey> findKeysOwnedBy(UUID ownerId) {
        return dslContext
                .select(PROJECTS.KEY)
                .from(PROJECTS)
                .where(PROJECTS.OWNER_ID.eq(ownerId))
                .fetch(record -> ProjectKey.of(record.value1()));
    }

    private static Project toDomain(ProjectsRecord projectsRecord) {
        return Project.restore(
                projectsRecord.getId(),
                projectsRecord.getOwnerId(),
                ProjectName.of(projectsRecord.getName()),
                ProjectKey.of(projectsRecord.getKey()),
                projectsRecord.getNextNumber(),
                projectsRecord.getCreatedAt(),
                projectsRecord.getUpdatedAt());
    }
}
