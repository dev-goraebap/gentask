package xyz.gentask.module.project.application.member;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MemberStore {
    record MemberView(UUID id, String name, String role, Instant joinedAt) {}

    record InvitationView(
            String id,
            String projectId,
            String token,
            String label,
            String role,
            Instant expiresAt,
            boolean revoked,
            int uses) {}

    record InvitationPreview(String projectId, String projectName, String role, Instant expiresAt) {}

    Optional<String> role(UUID userId, String projectId);

    void lockProject(String projectId);

    List<MemberView> members(String projectId);

    List<InvitationView> invitations(String projectId);

    void insertInvitation(InvitationView invitation, UUID createdBy, Instant now);

    Optional<InvitationView> invitation(String token);

    String projectName(String projectId);

    boolean join(String projectId, UUID userId, String role, Instant now);

    void changeRole(String projectId, UUID userId, String role);

    void remove(String projectId, UUID userId);

    void revoke(String projectId, String id);

    void incrementUses(String id);
}
