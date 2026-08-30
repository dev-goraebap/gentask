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
        // 자격을 아직 갖지 못한 자리만 연다. 재설정은 비밀번호를 모르는 채 지나므로 세션을 요구할 수
        // 없고, 대신 일회용 코드가 그 자리에서 신원을 판정한다. 근거는 결정-0005.
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/api/v1/auth/signup",
                        "/api/v1/auth/signup/confirm",
                        "/api/v1/auth/signup/resend",
                        "/api/v1/auth/login",
                        "/api/v1/auth/password-reset",
                        "/api/v1/auth/password-reset/confirm",
                        "/api/v1/auth/password-reset/resend");

        // 신원이 선 뒤에 역할을 본다. 등록 순서가 곧 실행 순서다.
        registry.addInterceptor(adminInterceptor).addPathPatterns("/api/v1/admin/**");
    }
}
