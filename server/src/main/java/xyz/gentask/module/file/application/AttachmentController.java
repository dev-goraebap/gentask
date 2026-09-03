package xyz.gentask.module.file.application;

import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.gentask.module.file.application.AttachmentRequests.PresignAttachment;
import xyz.gentask.shared.storage.PresignedUpload;
import xyz.gentask.shared.web.CurrentUser;

/**
 * 첨부 파일 직접 업로드를 위한 Presigned URL 발급 컨트롤러다.
 *
 * 업로드 대상 도메인과 무관하게 공통 엔드포인트를 제공하며, 실제 엔터티와의 첨부 연결은 각 도메인 모듈의 API에서 처리한다.
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
