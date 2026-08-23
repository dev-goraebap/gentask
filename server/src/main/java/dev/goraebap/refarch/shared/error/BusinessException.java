package dev.goraebap.refarch.shared.error;

import lombok.Getter;

/**
 * 지금 상태가 이 요청을 허용하지 않는다는 실패.
 *
 * 직접 생성하지 않고 ErrorCode 의 raise 를 거친다. 메시지는 응답의 detail 로 노출되므로
 * 비밀이나 개인정보를 담지 않는다.
 */
@Getter
public class BusinessException extends RuntimeException {

    private final transient ErrorCode errorCode;

    BusinessException(ErrorCode errorCode, String detail) {
        super(detail);
        this.errorCode = errorCode;
    }
}
