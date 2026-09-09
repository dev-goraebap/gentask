package xyz.gentask.module.note.infrastructure;

import static xyz.gentask.jooq.Tables.NOTES;
import static xyz.gentask.jooq.Tables.NOTE_TAGS;
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
            UUID userId,
            String projectId,
            boolean personal,
            String search,
            int offset,
            int limit,
            String sort,
            String archive,
            String tag) {
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
                .and(archive.equals("all") ? DSL.noCondition() : NOTES.ARCHIVED.eq(archive.equals("archived")))
                .and(
                        tag.isBlank()
                                ? DSL.noCondition()
                                : DSL.exists(dsl.selectOne()
                                        .from(NOTE_TAGS)
                                        .where(NOTE_TAGS.NOTE_ID.eq(NOTES.ID))
                                        .and(NOTE_TAGS.TAG.eq(tag))))
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
                row.get(NOTES.ARCHIVED),
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
    public void archive(String id, boolean archived, Instant now) {
        dsl.update(NOTES)
                .set(NOTES.ARCHIVED, archived)
                .set(NOTES.UPDATED_AT, now)
                .where(NOTES.ID.eq(id))
                .execute();
    }

    @Override
    public List<String> tags(String id) {
        return dsl.select(NOTE_TAGS.TAG)
                .from(NOTE_TAGS)
                .where(NOTE_TAGS.NOTE_ID.eq(id))
                .orderBy(NOTE_TAGS.TAG)
                .fetch(NOTE_TAGS.TAG);
    }

    @Override
    public void tags(String id, List<String> tags) {
        dsl.deleteFrom(NOTE_TAGS).where(NOTE_TAGS.NOTE_ID.eq(id)).execute();
        for (String tag : tags)
            dsl.insertInto(NOTE_TAGS)
                    .set(NOTE_TAGS.NOTE_ID, id)
                    .set(NOTE_TAGS.TAG, tag)
                    .execute();
    }

    @Override
    public List<xyz.gentask.module.note.NoteReferenceIn.Reference> references(
            UUID userId, String projectId, List<String> ids) {
        return dsl.select(NOTES.ID, NOTES.BODY, NOTES.ARCHIVED)
                .from(NOTES)
                .where(NOTES.ID.in(ids))
                .and(
                        projectId == null
                                ? NOTES.PROJECT_ID.isNull().and(NOTES.OWNER_ID.eq(userId))
                                : NOTES.PROJECT_ID.eq(projectId).and(NOTES.SHARED.isTrue()))
                .orderBy(NOTES.CREATED_AT.desc(), NOTES.ID)
                .fetch(row -> new xyz.gentask.module.note.NoteReferenceIn.Reference(
                        row.value1(),
                        row.value2().substring(0, Math.min(200, row.value2().length())),
                        row.value3()));
    }

    @Override
    public void delete(String id) {
        dsl.deleteFrom(NOTES).where(NOTES.ID.eq(id)).execute();
    }
}
