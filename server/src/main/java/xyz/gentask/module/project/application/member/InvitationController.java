package xyz.gentask.module.project.application.member;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.gentask.module.project.application.member.MemberStore.InvitationPreview;
import xyz.gentask.shared.web.CurrentUser;

@RestController
@RequestMapping("/api/v1/invitations/{token}")
@RequiredArgsConstructor
public class InvitationController {
    private final MemberService service;

    @GetMapping("/preview")
    public InvitationPreview preview(@PathVariable String token) {
        return service.preview(token);
    }

    @PostMapping("/accept")
    public InvitationPreview accept(@CurrentUser UUID userId, @PathVariable String token) {
        return service.accept(userId, token);
    }
}
