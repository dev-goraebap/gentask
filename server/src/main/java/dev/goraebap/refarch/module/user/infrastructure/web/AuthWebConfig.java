package dev.goraebap.refarch.module.user.infrastructure.web;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * API 전체를 지키고 예외를 열거한다 (deny-by-default). 새 엔드포인트는 아무것도 하지
 * 않아도 지켜지는 쪽에 떨어진다.
 *
 * /v3/api-docs 는 /api/** 밖이라 목록에 없다. 명세 발행은 인증 없이 된다.
 */
@Configuration
@RequiredArgsConstructor
class AuthWebConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/v1/auth/signup", "/api/v1/auth/login");
    }
}
