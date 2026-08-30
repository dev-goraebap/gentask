package dev.goraebap.refarch.module.user.application;

import dev.goraebap.refarch.shared.error.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum UserErrorCode implements ErrorCode {
    EMAIL_ALREADY_USED(HttpStatus.CONFLICT, "이미 등록된 이메일입니다"),

    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 맞지 않습니다"),

    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다"),

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"),

    FORBIDDEN(HttpStatus.FORBIDDEN, "이 자리에 들어갈 권한이 없습니다");

    private final HttpStatus status;
    private final String message;
}
