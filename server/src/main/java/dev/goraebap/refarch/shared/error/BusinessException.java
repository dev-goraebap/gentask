package dev.goraebap.refarch.shared.error;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final transient ErrorCode errorCode;

    BusinessException(ErrorCode errorCode, String detail) {
        super(detail);
        this.errorCode = errorCode;
    }
}
