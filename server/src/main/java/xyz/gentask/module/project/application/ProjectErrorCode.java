package xyz.gentask.module.project.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.gentask.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum ProjectErrorCode implements ErrorCode {
    MEMBER_FORBIDDEN(HttpStatus.FORBIDDEN, "이 작업을 수행할 권한이 없습니다"),
    INVALID_MEMBER_ROLE(HttpStatus.BAD_REQUEST, "역할을 확인해 주세요"),
    INVITATION_EXPIRED(HttpStatus.GONE, "만료되었거나 비활성화된 초대 링크입니다"),
    PROJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다");

    private final HttpStatus status;
    private final String message;
}
