package dev.goraebap.devkit.auth.infrastructure.config;

import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import dev.goraebap.devkit.auth.application.shared.SecureTokenGenerator;
import dev.goraebap.devkit.auth.application.shared.SessionCookieFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

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
}
