package dev.goraebap.devkit.common;

/**
 * 비즈니스 오류의 공통 타입 (설계/서버.md §7).
 *
 * <p>컨트롤러는 {@code ResponseEntity}를 직접 조립하지 않는다 — 이 예외를 던지면 전역 예외
 * 핸들러가 RFC 7807 응답으로 변환한다. 메시지는 응답의 {@code detail}로 노출되므로 비밀·개인정보를
 * 담지 않는다.
 */
public class BusinessException extends RuntimeException {

    private final transient ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode, String detail) {
        super(detail);
        this.errorCode = errorCode;
    }

    public ErrorCode errorCode() {
        return errorCode;
    }
}
