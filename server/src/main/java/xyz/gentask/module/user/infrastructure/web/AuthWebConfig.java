package xyz.gentask.module.user.infrastructure.web;

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
        // 비인증 상태에서 호출 가능한 회원 가입 및 비밀번호 재설정 경로를 인터셉터 예외로 등록한다(결정-0005).
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

        // 인증 인터셉터 통과 후 관리자 인가 인터셉터를 순차 실행한다.
        registry.addInterceptor(adminInterceptor).addPathPatterns("/api/v1/admin/**");
    }
}
