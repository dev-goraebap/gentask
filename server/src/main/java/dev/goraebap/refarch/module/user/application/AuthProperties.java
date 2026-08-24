package dev.goraebap.refarch.module.user.application;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** 인증 설정. 값은 application.properties 가 갖고 배포에서는 환경변수로 덮는다. */
@ConfigurationProperties(prefix = "auth")
public record AuthProperties(String secret, Session session) {

    public AuthProperties {
        // 짧은 키로 조용히 뜨면 해시가 뚫리는 쪽으로 동작한다. 기동을 막는 편이 낫다.
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("auth.secret 은 32자 이상이어야 합니다");
        }
    }

    public record Session(
            Duration ttl, Duration absoluteTtl, Duration touchInterval, String cookieName, boolean cookieSecure) {}
}
