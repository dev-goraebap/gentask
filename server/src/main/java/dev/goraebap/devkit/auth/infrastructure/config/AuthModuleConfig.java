package dev.goraebap.devkit.auth.infrastructure.config;

import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import dev.goraebap.devkit.auth.application.shared.SecureTokenGenerator;
import dev.goraebap.devkit.auth.application.shared.SessionCookieFactory;
import dev.goraebap.devkit.auth.application.shared.TokenHasher;
import dev.goraebap.devkit.auth.application.sociallogin.PendingSocialTicketCodec;
import dev.goraebap.devkit.auth.application.sociallogin.SocialLoginService;
import dev.goraebap.devkit.auth.application.sociallogin.SocialTicketCookieFactory;
import dev.goraebap.devkit.auth.infrastructure.oauth.SocialLoginSuccessHandler;
import java.time.Clock;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

/** auth 모듈의 빈 조립 (설계/서버.md §3 — 모듈 config는 모듈 안에 둔다). */
@Configuration
@EnableScheduling
@EnableConfigurationProperties(AuthProperties.class)
class AuthModuleConfig {

    @Bean
    SecureTokenGenerator secureTokenGenerator() {
        return new SecureTokenGenerator();
    }

    @Bean
    SessionCookieFactory sessionCookieFactory(AuthProperties properties) {
        return new SessionCookieFactory(properties);
    }

    @Bean
    PendingSocialTicketCodec pendingSocialTicketCodec(TokenHasher tokenHasher, Clock clock) {
        return new PendingSocialTicketCodec(tokenHasher, clock);
    }

    @Bean
    SocialTicketCookieFactory socialTicketCookieFactory(AuthProperties properties) {
        return new SocialTicketCookieFactory(properties);
    }

    @Bean
    AuthenticationSuccessHandler socialLoginSuccessHandler(
            SocialLoginService socialLoginService,
            SessionCookieFactory cookieFactory,
            SocialTicketCookieFactory ticketCookieFactory,
            AuthProperties properties,
            Clock clock) {
        return new SocialLoginSuccessHandler(
                socialLoginService, cookieFactory, ticketCookieFactory, properties.oauthRedirectBase(), clock);
    }
}
