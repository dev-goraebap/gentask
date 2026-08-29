package dev.goraebap.refarch.module.user.infrastructure.web;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
class AuthWebConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;
    private final AdminInterceptor adminInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/v1/auth/signup", "/api/v1/auth/login");

        // 신원이 선 뒤에 역할을 본다. 등록 순서가 곧 실행 순서다.
        registry.addInterceptor(adminInterceptor).addPathPatterns("/api/v1/admin/**");
    }
}
