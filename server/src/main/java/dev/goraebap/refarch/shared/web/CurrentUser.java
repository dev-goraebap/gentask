package dev.goraebap.refarch.shared.web;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 로그인한 사용자의 식별자를 컨트롤러 인자로 받는다.
 *
 * 값은 인증 인터셉터(user 모듈)가 요청 속성에 넣고, 공용 리졸버가 꺼낸다. 공용 기반이
 * 모듈을 모르는 채 성립하는 이유는 둘 사이의 계약이 속성 이름 하나이기 때문이다.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUser {

    /** 인증 인터셉터가 채우는 요청 속성 이름. 값은 UUID 다. */
    String ATTRIBUTE = "dev.goraebap.refarch.authenticatedUserId";
}
