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

    // 거둔 코드와 만료된 코드가 같은 응답을 낸다. 나누면 몇 번 남았는지가 밖으로 드러난다.
    VERIFICATION_CODE_EXPIRED(HttpStatus.GONE, "코드가 만료되었습니다. 다시 받아 주세요"),

    VERIFICATION_CODE_MISMATCH(HttpStatus.BAD_REQUEST, "코드가 맞지 않습니다"),

    CURRENT_PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "현재 비밀번호가 맞지 않습니다"),

    SAME_PASSWORD(HttpStatus.BAD_REQUEST, "지금 쓰는 비밀번호와 다른 것으로 정해 주세요"),

    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다"),

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"),

    FORBIDDEN(HttpStatus.FORBIDDEN, "이 자리에 들어갈 권한이 없습니다");

    private final HttpStatus status;
    private final String message;
}
