package xyz.gentask.module.user.application.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "auth")
public record AuthProperties(String secret, Session session) {

    public AuthProperties {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("auth.secret 은 32자 이상이어야 합니다");
        }
    }

    public record Session(
            Duration ttl, Duration absoluteTtl, Duration touchInterval, String cookieName, boolean cookieSecure) {}
}
