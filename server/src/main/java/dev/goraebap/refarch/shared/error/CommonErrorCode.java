package dev.goraebap.refarch.shared.error;

import org.springframework.http.HttpStatus;

/**
 * 특정 모듈에 속하지 않는 에러 코드.
 *
 * <p>모듈 열거형에는 그 모듈 고유의 사유만 담고 잘못된 요청 · 충돌 · 서버 오류는 여기 한 벌만
 * 둔다. 모듈이 늘어도 복제되지 않는다.
 */
public enum CommonErrorCode implements ErrorCode {
    COMMON_INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청이 올바르지 않습니다"),

    /** 같은 자원을 동시에 만들려는 요청이 겹쳤다 — 유일성 제약이 막은 경우다. */
    COMMON_CONFLICT(HttpStatus.CONFLICT, "요청이 다른 작업과 충돌했습니다"),

    COMMON_INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다");

    private final HttpStatus status;
    private final String message;

    CommonErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    @Override
    public HttpStatus status() {
        return status;
    }

    @Override
    public String message() {
        return message;
    }
}
