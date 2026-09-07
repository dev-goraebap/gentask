package xyz.gentask.module.project.infrastructure;

import static xyz.gentask.jooq.Tables.PROJECTS;
import static xyz.gentask.jooq.Tables.PROJECT_INVITATIONS;
import static xyz.gentask.jooq.Tables.PROJECT_MEMBERS;
import static xyz.gentask.jooq.Tables.USERS;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.module.project.application.member.MemberStore;

@Repository
@RequiredArgsConstructor
class JooqMemberStore implements MemberStore {
    private final DSLContext dsl;

    @Override
    public Optional<String> role(UUID userId, String projectId) {
        if (dsl.fetchExists(PROJECTS, PROJECTS.ID.eq(projectId).and(PROJECTS.OWNER_ID.eq(userId)))) {
            return Optional.of("owner");
        }
        return dsl.select(PROJECT_MEMBERS.ROLE)
                .from(PROJECT_MEMBERS)
                .where(PROJECT_MEMBERS.PROJECT_ID.eq(projectId).and(PROJECT_MEMBERS.USER_ID.eq(userId)))
                .fetchOptional(PROJECT_MEMBERS.ROLE);
    }

    @Override
    public void lockProject(String projectId) {
        dsl.select(PROJECTS.ID)
                .from(PROJECTS)
                .where(PROJECTS.ID.eq(projectId))
                .forUpdate()
                .fetch();
    }

    @Override
    public List<MemberView> members(String projectId) {
        List<MemberView> result = new ArrayList<>(dsl.select(USERS.ID, USERS.NICKNAME, PROJECTS.CREATED_AT)
                .from(PROJECTS)
                .join(USERS)
                .on(USERS.ID.eq(PROJECTS.OWNER_ID))
                .where(PROJECTS.ID.eq(projectId))
                .fetch(r -> new MemberView(r.value1(), r.value2(), "owner", r.value3())));
        result.addAll(dsl.select(USERS.ID, USERS.NICKNAME, PROJECT_MEMBERS.ROLE, PROJECT_MEMBERS.JOINED_AT)
                .from(PROJECT_MEMBERS)
                .join(USERS)
                .on(USERS.ID.eq(PROJECT_MEMBERS.USER_ID))
                .where(PROJECT_MEMBERS.PROJECT_ID.eq(projectId))
                .orderBy(PROJECT_MEMBERS.JOINED_AT.asc(), USERS.ID.asc())
                .fetch(r -> new MemberView(r.value1(), r.value2(), r.value3(), r.value4())));
        return result;
    }

    @Override
    public List<InvitationView> invitations(String projectId) {
        return dsl.selectFrom(PROJECT_INVITATIONS)
                .where(PROJECT_INVITATIONS.PROJECT_ID.eq(projectId))
                .orderBy(PROJECT_INVITATIONS.CREATED_AT.desc())
                .fetch(r -> new InvitationView(
                        r.getId(),
                        r.getProjectId(),
                        r.getToken(),
                        r.getLabel(),
                        r.getRole(),
                        r.getExpiresAt(),
                        r.getRevoked(),
                        r.getUses()));
    }

    @Override
    public void insertInvitation(InvitationView invitation, UUID createdBy, Instant now) {
        dsl.insertInto(PROJECT_INVITATIONS)
                .set(PROJECT_INVITATIONS.ID, invitation.id())
                .set(PROJECT_INVITATIONS.PROJECT_ID, invitation.projectId())
                .set(PROJECT_INVITATIONS.TOKEN, invitation.token())
                .set(PROJECT_INVITATIONS.LABEL, invitation.label())
                .set(PROJECT_INVITATIONS.ROLE, invitation.role())
                .set(PROJECT_INVITATIONS.CREATED_BY, createdBy)
                .set(PROJECT_INVITATIONS.CREATED_AT, now)
                .set(PROJECT_INVITATIONS.EXPIRES_AT, invitation.expiresAt())
                .execute();
    }

    @Override
    public Optional<InvitationView> invitation(String token) {
        return dsl.selectFrom(PROJECT_INVITATIONS)
                .where(PROJECT_INVITATIONS.TOKEN.eq(token))
                .fetchOptional(r -> new InvitationView(
                        r.getId(),
                        r.getProjectId(),
                        r.getToken(),
                        r.getLabel(),
                        r.getRole(),
                        r.getExpiresAt(),
                        r.getRevoked(),
                        r.getUses()));
    }

    @Override
    public String projectName(String projectId) {
        return dsl.select(PROJECTS.NAME)
                .from(PROJECTS)
                .where(PROJECTS.ID.eq(projectId))
                .fetchSingle(PROJECTS.NAME);
    }

    @Override
    public boolean join(String projectId, UUID userId, String role, Instant now) {
        return dsl.insertInto(PROJECT_MEMBERS)
                        .set(PROJECT_MEMBERS.PROJECT_ID, projectId)
                        .set(PROJECT_MEMBERS.USER_ID, userId)
                        .set(PROJECT_MEMBERS.ROLE, role)
                        .set(PROJECT_MEMBERS.JOINED_AT, now)
                        .onConflictDoNothing()
                        .execute()
                == 1;
    }

    @Override
    public void changeRole(String projectId, UUID userId, String role) {
        dsl.update(PROJECT_MEMBERS)
                .set(PROJECT_MEMBERS.ROLE, role)
                .where(PROJECT_MEMBERS.PROJECT_ID.eq(projectId).and(PROJECT_MEMBERS.USER_ID.eq(userId)))
                .execute();
    }

    @Override
    public void remove(String projectId, UUID userId) {
        var tasks = xyz.gentask.jooq.Tables.TASKS;
        dsl.update(tasks)
                .setNull(tasks.ASSIGNEE_ID)
                .where(tasks.PROJECT_ID.eq(projectId).and(tasks.ASSIGNEE_ID.eq(userId)))
                .execute();
        dsl.deleteFrom(PROJECT_MEMBERS)
                .where(PROJECT_MEMBERS.PROJECT_ID.eq(projectId).and(PROJECT_MEMBERS.USER_ID.eq(userId)))
                .execute();
    }

    @Override
    public void revoke(String projectId, String id) {
        dsl.update(PROJECT_INVITATIONS)
                .set(PROJECT_INVITATIONS.REVOKED, true)
                .where(PROJECT_INVITATIONS.PROJECT_ID.eq(projectId).and(PROJECT_INVITATIONS.ID.eq(id)))
                .execute();
    }

    @Override
    public void incrementUses(String id) {
        dsl.update(PROJECT_INVITATIONS)
                .set(PROJECT_INVITATIONS.USES, PROJECT_INVITATIONS.USES.plus(1))
                .where(PROJECT_INVITATIONS.ID.eq(id))
                .execute();
    }
}
