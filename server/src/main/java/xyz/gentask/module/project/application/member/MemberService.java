package xyz.gentask.module.project.application.member;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.project.application.ProjectErrorCode;
import xyz.gentask.module.project.application.member.MemberStore.InvitationPreview;
import xyz.gentask.module.project.application.member.MemberStore.InvitationView;
import xyz.gentask.shared.domain.NanoId;

@Service
@RequiredArgsConstructor
public class MemberService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final MemberStore store;
    private final Clock clock;
    private final xyz.gentask.module.file.Attachments attachments;

    public record MemberProfileView(
            UUID id, String name, String role, java.time.Instant joinedAt, String profileImageUrl) {}

    @Transactional(readOnly = true)
    public List<MemberProfileView> list(UUID userId, String projectId) {
        requireRole(userId, projectId);
        return store.members(projectId).stream()
                .map(m -> new MemberProfileView(
                        m.id(),
                        m.name(),
                        m.role(),
                        m.joinedAt(),
                        attachments
                                .findSingle(xyz.gentask.module.file.AttachmentSlot.USER_PROFILE_IMAGE, m.id())
                                .map(xyz.gentask.module.file.AttachmentView::url)
                                .orElse(null)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InvitationView> invitations(UUID userId, String projectId) {
        requireOwner(userId, projectId);
        return store.invitations(projectId);
    }

    @Transactional
    public InvitationView create(UUID userId, String projectId, String label, String role, int days) {
        store.lockProject(projectId);
        requireOwner(userId, projectId);
        validateRole(role);
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        var invitation = new InvitationView(
                NanoId.generate(),
                projectId,
                Base64.getUrlEncoder().withoutPadding().encodeToString(bytes),
                label.strip(),
                role,
                clock.instant().plus(Duration.ofDays(days)),
                false,
                0);
        store.insertInvitation(invitation, userId, clock.instant());
        return invitation;
    }

    @Transactional(readOnly = true)
    public InvitationPreview preview(String token) {
        var invitation = active(token);
        return new InvitationPreview(
                invitation.projectId(),
                store.projectName(invitation.projectId()),
                invitation.role(),
                invitation.expiresAt());
    }

    @Transactional
    public InvitationPreview accept(UUID userId, String token) {
        var initial = active(token);
        store.lockProject(initial.projectId());
        var invitation = active(token);
        if (store.role(userId, invitation.projectId()).isEmpty()
                && store.join(invitation.projectId(), userId, invitation.role(), clock.instant())) {
            store.incrementUses(invitation.id());
        }
        return new InvitationPreview(
                invitation.projectId(),
                store.projectName(invitation.projectId()),
                requireRole(userId, invitation.projectId()),
                invitation.expiresAt());
    }

    @Transactional
    public void changeRole(UUID userId, String projectId, UUID memberId, String role) {
        store.lockProject(projectId);
        requireOwner(userId, projectId);
        validateRole(role);
        if ("owner".equals(requireRole(memberId, projectId))) throw ProjectErrorCode.MEMBER_FORBIDDEN.raise();
        store.changeRole(projectId, memberId, role);
    }

    @Transactional
    public void remove(UUID userId, String projectId, UUID memberId) {
        store.lockProject(projectId);
        requireOwner(userId, projectId);
        if ("owner".equals(requireRole(memberId, projectId))) throw ProjectErrorCode.MEMBER_FORBIDDEN.raise();
        store.remove(projectId, memberId);
    }

    @Transactional
    public void revoke(UUID userId, String projectId, String id) {
        store.lockProject(projectId);
        requireOwner(userId, projectId);
        store.revoke(projectId, id);
    }

    private String requireRole(UUID userId, String projectId) {
        return store.role(userId, projectId).orElseThrow(ProjectErrorCode.PROJECT_NOT_FOUND::raise);
    }

    private void requireOwner(UUID userId, String projectId) {
        if (!"owner".equals(requireRole(userId, projectId))) throw ProjectErrorCode.MEMBER_FORBIDDEN.raise();
    }

    private static void validateRole(String role) {
        if (!"editor".equals(role) && !"viewer".equals(role)) throw ProjectErrorCode.INVALID_MEMBER_ROLE.raise();
    }

    private InvitationView active(String token) {
        return store.invitation(token)
                .filter(i -> !i.revoked() && clock.instant().isBefore(i.expiresAt()))
                .orElseThrow(ProjectErrorCode.INVITATION_EXPIRED::raise);
    }
}
