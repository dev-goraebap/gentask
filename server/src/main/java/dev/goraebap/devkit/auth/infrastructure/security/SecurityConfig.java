package dev.goraebap.devkit.auth.infrastructure.security;

import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import dev.goraebap.devkit.auth.application.shared.TokenHasher;
import dev.goraebap.devkit.auth.domain.session.SessionRepository;
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;

/**
 * 인증 필터체인 (설계/서버.md §8) — 기본 거부(deny-by-default). 보호가 필요한 리소스를 기본으로
 * 막고 예외적으로 연다.
 *
 * <p>앱 전체를 보호하지만 auth 모듈의 internal에 의존하므로 여기 있다 — 인증·인가는 auth 모듈이
 * 앱에 제공하는 능력이다 (설계/서버.md §3).
 *
 * <p>Spring의 CSRF 토큰 방식 대신 {@link OriginCheckFilter}(Origin 검증) + {@code SameSite=Lax}
 * 쿠키를 쓴다 — 세션을 서버 렌더 폼 없이 API로만 쓰므로 토큰 왕복이 필요 없다.
 */
@Configuration
class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            SessionRepository sessionRepository,
            TokenHasher tokenHasher,
            AuthProperties properties,
            Clock clock,
            ProblemResponseWriter problemWriter)
            throws Exception {
        SessionTokenAuthenticationFilter sessionFilter =
                new SessionTokenAuthenticationFilter(sessionRepository, tokenHasher, properties, clock);
        OriginCheckFilter originFilter = new OriginCheckFilter(properties, problemWriter);

        http.csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        // 복구 경로는 로그인할 수 없는 사용자를 위한 것이라 세션을 요구할 수 없다 —
                        // 보호는 OTP와 시도 제한이 담당한다 (AUTH-07·08)
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/email-verifications",
                                "/api/v1/users",
                                "/api/v1/sessions",
                                "/api/v1/password-resets",
                                "/api/v1/password-resets/confirm",
                                "/api/v1/account-recoveries",
                                "/api/v1/account-recoveries/confirm")
                        .permitAll()
                        .requestMatchers("/actuator/health/**", "/actuator/health")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .exceptionHandling(handling -> handling.authenticationEntryPoint(
                                (request, response, exception) -> problemWriter.write(
                                        request, response, AuthErrorCode.AUTH_UNAUTHENTICATED, "로그인이 필요합니다"))
                        .accessDeniedHandler((request, response, exception) -> problemWriter.write(
                                request, response, AuthErrorCode.AUTH_FORBIDDEN_ORIGIN, "접근 권한이 없습니다")))
                .addFilterBefore(originFilter, AuthorizationFilter.class)
                .addFilterBefore(sessionFilter, AuthorizationFilter.class);

        return http.build();
    }
}
