package dev.goraebap.refarch.module.user.application.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 일회용 코드의 규격. 값의 근거는 결정-0012 가 갖는다.
 *
 * @param codeLength 자릿수
 * @param codeTtl 발급으로부터의 수명
 * @param maxAttempts 코드 하나가 받는 검증 시도. 넘기면 그 코드를 거둔다
 */
@ConfigurationProperties(prefix = "app.credential")
public record CredentialProperties(int codeLength, Duration codeTtl, int maxAttempts) {

    public CredentialProperties {
        if (codeLength < 4) {
            throw new IllegalStateException("app.credential.code-length 는 4 이상이어야 합니다");
        }
        if (maxAttempts < 1) {
            throw new IllegalStateException("app.credential.max-attempts 는 1 이상이어야 합니다");
        }
    }
}
