package dev.goraebap.refarch.shared.error;

/**
 * 지금 상태가 이 요청을 허용하지 않는다는 실패.
 *
 * <p>컨트롤러가 {@code ResponseEntity} 를 직접 조립하지 않는다 — 이 예외를 던지면 전역 예외
 * 핸들러가 RFC 9457 응답으로 옮긴다. 메시지는 응답의 {@code detail} 로 노출되므로 비밀이나
 * 개인정보를 담지 않는다.
 *
 * <p>직접 생성하지 않고 {@link ErrorCode#raise()} 를 거친다.
 */
public class BusinessException extends RuntimeException {

    private final transient ErrorCode errorCode;

    BusinessException(ErrorCode errorCode, String detail) {
        super(detail);
        this.errorCode = errorCode;
    }

    public ErrorCode errorCode() {
        return errorCode;
    }
}
