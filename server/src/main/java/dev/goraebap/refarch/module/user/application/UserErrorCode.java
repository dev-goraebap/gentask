package dev.goraebap.refarch.module.user.application;

import dev.goraebap.refarch.shared.error.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum UserErrorCode implements ErrorCode {
    /** TK-005 A3. */
    EMAIL_ALREADY_USED(HttpStatus.CONFLICT, "이미 등록된 이메일입니다"),

    /** TK-005 A2. 이메일과 비밀번호 중 어느 쪽이 틀렸는지 구분하지 않는다. */
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 맞지 않습니다"),

    /** TK-005 A5. */
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다"),

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"),

    /** TK-006 A1. */
    PROFILE_IMAGE_NOT_IMAGE(HttpStatus.BAD_REQUEST, "이미지 파일만 올릴 수 있습니다"),

    /** TK-006 A1. 크기 상한은 파일 첨부와 같다. */
    PROFILE_IMAGE_TOO_LARGE(HttpStatus.BAD_REQUEST, "이미지는 10MB 를 넘을 수 없습니다"),

    /** 확정하려는 키가 보관소에 없다. 올리기 전에 확정을 불렀거나 올리기가 실패한 경우다. */
    PROFILE_IMAGE_NOT_UPLOADED(HttpStatus.BAD_REQUEST, "올라간 이미지가 없습니다");

    private final HttpStatus status;
    private final String message;
}
