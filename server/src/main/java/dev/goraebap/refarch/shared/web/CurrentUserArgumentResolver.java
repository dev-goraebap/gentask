package dev.goraebap.refarch.shared.web;

import java.util.UUID;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/** {@link CurrentUser} 가 붙은 UUID 인자를 요청 속성에서 채운다. */
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
                && UUID.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory) {
        Object userId = webRequest.getAttribute(CurrentUser.ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
        if (userId == null) {
            // 인증 인터셉터가 지키지 않는 경로에서 썼다는 뜻이다. 구성 오류라 요청 오류로 덮지 않는다.
            throw new IllegalStateException("인증되지 않은 경로에서 @CurrentUser 를 사용했습니다");
        }
        return userId;
    }
}
