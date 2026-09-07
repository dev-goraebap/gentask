package xyz.gentask.module.project.application.member;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.gentask.module.project.application.member.MemberStore.InvitationView;
import xyz.gentask.shared.web.CurrentUser;

@RestController
@RequestMapping("/api/v1/projects/{projectId}")
@RequiredArgsConstructor
public class MemberController {
    public record CreateInvitation(
            @NotBlank @Size(max = 100) String label,
            @NotBlank @Pattern(regexp = "editor|viewer") String role,
            @Min(1) @Max(30) int days) {}

    public record ChangeMemberRole(
            @NotBlank @Pattern(regexp = "editor|viewer") String role) {}

    private final MemberService service;

    @GetMapping("/members")
    public List<MemberService.MemberProfileView> members(@CurrentUser UUID userId, @PathVariable String projectId) {
        return service.list(userId, projectId);
    }

    @PatchMapping("/members/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeRole(
            @CurrentUser UUID userId,
            @PathVariable String projectId,
            @PathVariable UUID memberId,
            @Valid @RequestBody ChangeMemberRole request) {
        service.changeRole(userId, projectId, memberId, request.role());
    }

    @DeleteMapping("/members/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@CurrentUser UUID userId, @PathVariable String projectId, @PathVariable UUID memberId) {
        service.remove(userId, projectId, memberId);
    }

    @GetMapping("/invitations")
    public List<InvitationView> invitations(@CurrentUser UUID userId, @PathVariable String projectId) {
        return service.invitations(userId, projectId);
    }

    @PostMapping("/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public InvitationView create(
            @CurrentUser UUID userId, @PathVariable String projectId, @Valid @RequestBody CreateInvitation request) {
        return service.create(userId, projectId, request.label(), request.role(), request.days());
    }

    @DeleteMapping("/invitations/{invitationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@CurrentUser UUID userId, @PathVariable String projectId, @PathVariable String invitationId) {
        service.revoke(userId, projectId, invitationId);
    }
}
