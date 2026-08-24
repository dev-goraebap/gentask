package dev.goraebap.refarch.shared.web;

import java.util.List;
import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** 공용 웹 배선. 모듈이 놓는 것(인증 인터셉터)은 각 모듈의 설정이 갖는다. */
@Configuration
class SharedWebConfig implements WebMvcConfigurer {

    static {
        // 리졸버가 채우는 인자라 명세의 파라미터가 아니다. 명세에 남으면 클라이언트가 보내려 든다.
        SpringDocUtils.getConfig().addAnnotationsToIgnore(CurrentUser.class);
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new CurrentUserArgumentResolver());
    }
}
