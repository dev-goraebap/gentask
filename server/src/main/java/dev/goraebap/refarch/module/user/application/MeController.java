package dev.goraebap.refarch.module.user.application;

import dev.goraebap.refarch.module.user.application.UserRequests.ChangeNickname;
import dev.goraebap.refarch.module.user.application.UserRequests.ConfirmProfileImage;
import dev.goraebap.refarch.module.user.application.UserRequests.PresignProfileImage;
import dev.goraebap.refarch.module.user.application.UserViews.IssuedApiToken;
import dev.goraebap.refarch.module.user.application.UserViews.MeView;
import dev.goraebap.refarch.shared.storage.PresignedUpload;
import dev.goraebap.refarch.shared.web.CurrentUser;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** TK-006. */
@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class MeController {

    private final MeService meService;

    @GetMapping
    public MeView me(@CurrentUser UUID userId) {
        return meService.me(userId);
    }

    @PatchMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeNickname(@CurrentUser UUID userId, @Valid @RequestBody ChangeNickname request) {
        meService.changeNickname(userId, request.nickname());
    }

    /** TK-006 A3. 토큰 원문이 실리는 유일한 응답이다. */
    @PostMapping("/api-token")
    @ResponseStatus(HttpStatus.CREATED)
    public IssuedApiToken issueApiToken(@CurrentUser UUID userId) {
        return meService.issueApiToken(userId);
    }

    @DeleteMapping("/api-token")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteApiToken(@CurrentUser UUID userId) {
        meService.deleteApiToken(userId);
    }

    /** TK-006 A1. 백엔드는 URL 만 주고 바이트는 브라우저가 보관소로 직접 올린다. */
    @PostMapping("/profile-image/presign")
    public PresignedUpload presignProfileImage(
            @CurrentUser UUID userId, @Valid @RequestBody PresignProfileImage request) {
        return meService.presignProfileImage(userId, request.fileName(), request.contentType(), request.size());
    }

    @PutMapping("/profile-image")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmProfileImage(@CurrentUser UUID userId, @Valid @RequestBody ConfirmProfileImage request) {
        meService.confirmProfileImage(userId, request.objectKey());
    }

    @DeleteMapping("/profile-image")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearProfileImage(@CurrentUser UUID userId) {
        meService.clearProfileImage(userId);
    }
}
