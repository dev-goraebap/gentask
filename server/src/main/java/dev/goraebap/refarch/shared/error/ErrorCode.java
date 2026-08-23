package dev.goraebap.refarch.shared.error;

import org.springframework.http.HttpStatus;

/** 문구는 바뀔 수 있지만 code 는 클라이언트가 분기에 쓰는 계약이다. */
public interface ErrorCode {

    HttpStatus status();

    String message();

    /** 열거형이 제공한다. */
    String name();

    default String code() {
        return name();
    }

    default BusinessException raise() {
        return new BusinessException(this, message());
    }

    /** 선언한 문구 대신 이 상황의 맥락을 담을 때 쓴다. */
    default BusinessException raise(String detail) {
        return new BusinessException(this, detail);
    }
}
