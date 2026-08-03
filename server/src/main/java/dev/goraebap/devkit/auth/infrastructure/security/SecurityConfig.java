package dev.goraebap.devkit.auth.infrastructure.security;

import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import dev.goraebap.devkit.auth.application.shared.TokenHasher;
import dev.goraebap.devkit.auth.domain.session.SessionRepository;
import java.time.Clock;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

/**
 * 인증 필터체인 (설계/서버.md §8) — 기본 거부(deny-by-default). 보호가 필요한 리소스를 기본으로
 * 막고 예외적으로 연다.
 *
 * <p>앱 전체를 보호하지만 auth 모듈의 internal에 의존하므로 여기 있다 — 인증·인가는 auth 모듈이
 * 앱에 제공하는 능력이다 (설계/서버.md §3).
 *
 * <p>Spring의 CSRF 토큰 방식 대신 {@link OriginCheckFilter}(Origin 검증) + {@code SameSite=Lax}
 * 쿠키를 쓴다 — 세션을 서버 렌더 폼 없이 API로만 쓰므로 토큰 왕복이 필요 없다.
 *
 * <p><b>{@code STATELESS}의 범위에 주의한다.</b> 이 정책은 <b>Spring Security가 인증 컨텍스트를
 * 서블릿 세션에 저장하지 않는다</b>는 뜻이지, 앱이 서블릿 세션을 전혀 만들지 않는다는 뜻이 아니다.
 * {@code oauth2Login}은 인가 요청의 {@code state}와 PKCE {@code code_verifier}를 보관하려고 세션을
 * 만든다 — 소셜 로그인 왕복 동안만 쓰이고 우리 로그인 세션(DB, 결정-0014)과는 무관하다.
 * 그 때문에 생기는 두 가지(세션 무제한 생성, 수평 확장 시 스티키 세션 필요)는
 * {@link AuthorizationStartRateLimitFilter}와 application.properties의 세션 설정으로 다룬다.
 */
@Slf4j
@Configuration
class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            SessionRepository sessionRepository,
            TokenHasher tokenHasher,
            AuthProperties properties,
            Clock clock,
            ProblemResponseWriter problemWriter,
            AuthenticationSuccessHandler socialLoginSuccessHandler,
            OAuth2AuthorizationRequestResolver authorizationRequestResolver,
            AuthorizationStartRateLimitFilter authorizationStartRateLimitFilter)
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
                                "/api/v1/account-recoveries/confirm",
                                "/api/v1/social-logins/email",
                                "/api/v1/social-logins/confirm")
                        .permitAll()
                        // 제공자로 보내는 경로와 돌아오는 콜백 (AUTH-02·03)
                        .requestMatchers("/oauth2/authorization/**", "/auth/callback/**")
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
                // 소셜 로그인 (AUTH-02·03). 콜백 경로가 기본값이 아닌 이유는 application.properties 참조
                .oauth2Login(oauth2 -> oauth2.redirectionEndpoint(endpoint -> endpoint.baseUri("/auth/callback/*"))
                        // PKCE는 리졸버로만 켤 수 있다 — 아래 빈의 주석 참조 (F2)
                        .authorizationEndpoint(
                                endpoint -> endpoint.authorizationRequestResolver(authorizationRequestResolver))
                        .successHandler(socialLoginSuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            // 실패 사유를 그대로 노출하지 않는다 — 제공자 응답에는 계정 정보가 섞일 수 있다
                            log.warn("소셜 로그인 실패", exception);
                            response.sendRedirect(properties.oauthRedirectBase() + "/auth/error");
                        }))
                .addFilterBefore(authorizationStartRateLimitFilter, OAuth2AuthorizationRequestRedirectFilter.class)
                .addFilterBefore(originFilter, AuthorizationFilter.class)
                .addFilterBefore(sessionFilter, AuthorizationFilter.class);

        return http.build();
    }

    /**
     * 인가 요청에 PKCE를 붙인다 (AUTH-02·03, 보안 검토 F2).
     *
     * <p><b>설정 파일로는 켤 수 없다.</b> {@code DefaultOAuth2AuthorizationRequestResolver}는 클라이언트
     * 인증 방식이 {@code none}이거나 {@code ClientSettings.requireProofKey}가 참일 때만 PKCE를 붙이는데,
     * 구글·카카오 모두 시크릿을 쓰는 기밀 클라이언트라 첫 조건에 걸리지 않고, Spring Boot 4.1의
     * OAuth2 클라이언트 프로퍼티에는 {@code client-settings} 바인딩 자체가 없어 두 번째 조건을 켤
     * 방법이 없다. 그래서 리졸버를 직접 등록한다.
     *
     * <p><b>PKCE가 막는 것</b>: 인가 코드 주입. 공격자가 피해자의 인가 코드를 손에 넣으면(오픈
     * 리다이렉터, 리다이렉트 URI 오설정, 콘솔에 등록된 URI를 공유하는 다른 앱) 자기 브라우저의
     * 콜백에 그 코드를 실어 보낸다. {@code state}는 요청이 우리에게서 시작됐음만 증명할 뿐 <b>코드가
     * 누구 것인지</b>는 묶지 않는다. PKCE의 {@code code_verifier}가 그 결합을 만든다.
     */
    @Bean
    OAuth2AuthorizationRequestResolver authorizationRequestResolver(ClientRegistrationRepository registrations) {
        DefaultOAuth2AuthorizationRequestResolver resolver = new DefaultOAuth2AuthorizationRequestResolver(
                registrations, OAuth2AuthorizationRequestRedirectFilter.DEFAULT_AUTHORIZATION_REQUEST_BASE_URI);
        resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
        return resolver;
    }
}
