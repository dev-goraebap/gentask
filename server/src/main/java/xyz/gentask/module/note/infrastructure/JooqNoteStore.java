package xyz.gentask.module.note.infrastructure;

import static xyz.gentask.jooq.Tables.NOTES;
import static xyz.gentask.jooq.Tables.PROJECTS;
import static xyz.gentask.jooq.Tables.PROJECT_MEMBERS;
import static xyz.gentask.jooq.Tables.USERS;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.note.application.NoteStore;

@Repository
@RequiredArgsConstructor
class JooqNoteStore implements NoteStore {
    private final DSLContext dsl;

    @Override
    public boolean insert(String id, UUID ownerId, String projectId, String body, Instant now) {
        return dsl.insertInto(NOTES)
                        .set(NOTES.ID, id)
                        .set(NOTES.OWNER_ID, ownerId)
                        .set(NOTES.PROJECT_ID, projectId)
                        .set(NOTES.BODY, body)
                        .set(NOTES.SHARED, false)
                        .set(NOTES.CREATED_AT, now)
                        .set(NOTES.UPDATED_AT, now)
                        .onConflict(NOTES.ID)
                        .doNothing()
                        .execute()
                == 1;
    }

    @Override
    public Optional<NoteRecord> find(String id, boolean lock) {
        if (lock)
            dsl.select(NOTES.ID).from(NOTES).where(NOTES.ID.eq(id)).forUpdate().fetchOne();
        return dsl.select(NOTES.fields())
                .select(USERS.NICKNAME, PROJECTS.NAME)
                .from(NOTES)
                .join(USERS)
                .on(USERS.ID.eq(NOTES.OWNER_ID))
                .leftJoin(PROJECTS)
                .on(PROJECTS.ID.eq(NOTES.PROJECT_ID))
                .where(NOTES.ID.eq(id))
                .fetchOptional(this::map);
    }

    @Override
    public List<NoteRecord> list(
            UUID userId, String projectId, boolean personal, String search, int offset, int limit, String sort) {
        var membership = PROJECTS.OWNER_ID
                .eq(userId)
                .or(DSL.exists(dsl.selectOne()
                        .from(PROJECT_MEMBERS)
                        .where(PROJECT_MEMBERS.PROJECT_ID.eq(NOTES.PROJECT_ID))
                        .and(PROJECT_MEMBERS.USER_ID.eq(userId))));
        var visible = NOTES.OWNER_ID.eq(userId).or(NOTES.SHARED.eq(true).and(membership));
        return dsl.select(NOTES.fields())
                .select(USERS.NICKNAME, PROJECTS.NAME)
                .from(NOTES)
                .join(USERS)
                .on(USERS.ID.eq(NOTES.OWNER_ID))
                .leftJoin(PROJECTS)
                .on(PROJECTS.ID.eq(NOTES.PROJECT_ID))
                .where(visible)
                .and(
                        personal
                                ? NOTES.PROJECT_ID.isNull()
                                : projectId == null ? DSL.noCondition() : NOTES.PROJECT_ID.eq(projectId))
                .and(search.isBlank() ? DSL.noCondition() : NOTES.BODY.containsIgnoreCase(search))
                .orderBy(
                        switch (sort) {
                            case "created-asc" -> NOTES.CREATED_AT.asc();
                            case "updated-desc" -> NOTES.UPDATED_AT.desc();
                            default -> NOTES.CREATED_AT.desc();
                        },
                        NOTES.ID.desc())
                .limit(limit)
                .offset(offset)
                .fetch(this::map);
    }

    private NoteRecord map(Record row) {
        return new NoteRecord(
                row.get(NOTES.ID),
                row.get(NOTES.BODY),
                row.get(NOTES.PROJECT_ID),
                row.get(PROJECTS.NAME),
                row.get(NOTES.SHARED) && row.get(NOTES.PROJECT_ID) != null,
                row.get(NOTES.OWNER_ID),
                row.get(USERS.NICKNAME),
                row.get(NOTES.CREATED_AT),
                row.get(NOTES.UPDATED_AT));
    }

    @Override
    public void edit(String id, String body, Instant now) {
        dsl.update(NOTES)
                .set(NOTES.BODY, body)
                .set(NOTES.UPDATED_AT, now)
                .where(NOTES.ID.eq(id))
                .execute();
    }

    @Override
    public void connect(String id, String projectId, Instant now) {
        dsl.update(NOTES)
                .set(NOTES.PROJECT_ID, projectId)
                .set(NOTES.SHARED, false)
                .set(NOTES.UPDATED_AT, now)
                .where(NOTES.ID.eq(id))
                .execute();
    }

    @Override
    public void share(String id, boolean shared, Instant now) {
        dsl.update(NOTES)
                .set(NOTES.SHARED, shared)
                .set(NOTES.UPDATED_AT, now)
                .where(NOTES.ID.eq(id))
                .execute();
    }

    @Override
    public void delete(String id) {
        dsl.deleteFrom(NOTES).where(NOTES.ID.eq(id)).execute();
    }
}
