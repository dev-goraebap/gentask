package xyz.gentask.module.project.infrastructure;

import static xyz.gentask.jooq.Tables.PROJECTS;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.ProjectsRecord;
import xyz.gentask.module.project.domain.project.Project;
import xyz.gentask.module.project.domain.project.ProjectKey;
import xyz.gentask.module.project.domain.project.ProjectName;
import xyz.gentask.module.project.domain.project.ProjectRepository;

@Repository
@RequiredArgsConstructor
class JooqProjectRepository implements ProjectRepository {

    private final DSLContext dslContext;

    @Override
    public boolean insert(Project project) {
        return dslContext
                        .insertInto(PROJECTS)
                        .set(PROJECTS.ID, project.id())
                        .set(PROJECTS.OWNER_ID, project.ownerId())
                        .set(PROJECTS.NAME, project.name().value())
                        .set(PROJECTS.KEY, project.key().value())
                        .set(PROJECTS.CREATED_AT, project.createdAt())
                        .set(PROJECTS.UPDATED_AT, project.updatedAt())
                        .onConflict(PROJECTS.ID)
                        .doNothing()
                        .execute()
                == 1;
    }

    @Override
    public void save(Project project) {
        dslContext
                .insertInto(PROJECTS)
                .set(PROJECTS.ID, project.id())
                .set(PROJECTS.OWNER_ID, project.ownerId())
                .set(PROJECTS.NAME, project.name().value())
                .set(PROJECTS.KEY, project.key().value())
                .set(PROJECTS.CREATED_AT, project.createdAt())
                .set(PROJECTS.UPDATED_AT, project.updatedAt())
                .onConflict(PROJECTS.ID)
                .doUpdate()
                .set(PROJECTS.NAME, project.name().value())
                .set(PROJECTS.KEY, project.key().value())
                .set(PROJECTS.UPDATED_AT, project.updatedAt())
                .execute();
    }

    @Override
    public Optional<Project> findById(UUID ownerId, String id) {
        return dslContext
                .selectFrom(PROJECTS)
                .where(PROJECTS.OWNER_ID.eq(ownerId))
                .and(PROJECTS.ID.eq(id))
                .fetchOptional()
                .map(JooqProjectRepository::toDomain);
    }

    private static Project toDomain(ProjectsRecord projectsRecord) {
        return Project.restore(
                projectsRecord.getId(),
                projectsRecord.getOwnerId(),
                ProjectName.of(projectsRecord.getName()),
                ProjectKey.of(projectsRecord.getKey()),
                projectsRecord.getCreatedAt(),
                projectsRecord.getUpdatedAt());
    }
}
