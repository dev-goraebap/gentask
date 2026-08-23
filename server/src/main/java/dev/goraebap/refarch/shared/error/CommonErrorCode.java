package dev.goraebap.refarch.shared.error;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum CommonErrorCode implements ErrorCode {
    COMMON_INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청이 올바르지 않습니다"),

    /** 같은 자원을 동시에 만들려는 요청이 겹쳤다. */
    COMMON_CONFLICT(HttpStatus.CONFLICT, "요청이 다른 작업과 충돌했습니다"),

    COMMON_INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다");

    private final HttpStatus status;
    private final String message;
}
