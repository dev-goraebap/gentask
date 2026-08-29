package dev.goraebap.refarch.module.file.application;

import dev.goraebap.refarch.module.file.application.AttachmentRequests.PresignAttachment;
import dev.goraebap.refarch.shared.storage.PresignedUpload;
import dev.goraebap.refarch.shared.web.CurrentUser;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 올릴 자리를 내주는 자리. 도메인마다 두지 않는 것은 발급이 어느 레코드에 붙을지와 무관한 일이기
 * 때문이며, Active Storage 의 direct upload 도 애플리케이션 전체에 하나를 둔다.
 *
 * <p>붙이는 것은 여기 없다. 그것은 어느 레코드에 매는지를 정하는 일이라 그 레코드를 소유한 모듈의
 * 경로가 받는다.
 */
@RestController
@RequestMapping("/api/v1/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final FileService fileService;

    @PostMapping("/presign")
    public PresignedUpload presign(@CurrentUser UUID userId, @Valid @RequestBody PresignAttachment request) {
        return fileService.presign(request.slot(), userId, request.fileName(), request.contentType(), request.size());
    }
}
