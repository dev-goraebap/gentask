package dev.goraebap.refarch.shared.error;

import org.springframework.http.HttpStatus;

/**
 * 에러 응답의 안정적인 식별자 계약.
 *
 * <p>문구는 바뀔 수 있지만 {@code code} 는 클라이언트가 분기에 쓰는 계약이다. 코드 문자열은
 * {@code <모듈>_<사유>} 의 SCREAMING_SNAKE_CASE 이며, 하이픈은 요구사항 식별자, 언더스코어는
 * 에러 코드로 구분한다.
 *
 * <p>{@link #code()} 를 default 로 두는 이유는 열거형이 이미 {@code name()} 을 갖고 있기
 * 때문이고, {@link #raise()} 를 두는 이유는 <b>문자열을 두 번 쓰지 않기 위해서</b>다. 코드와
 * 문구를 함께 선언해 놓고 던질 때 문구를 다시 적으면 같은 문장이 두 곳에 존재하게 된다.
 */
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
