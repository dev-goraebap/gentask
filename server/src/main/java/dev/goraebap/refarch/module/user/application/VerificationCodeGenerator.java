package dev.goraebap.refarch.module.user.application;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

/**
 * 일회용 코드를 만든다.
 *
 * <p>자릿수만큼의 십진수를 뽑고 앞을 0 으로 채운다. 앞자리가 0 인 코드도 정상이며, 그것을 피하려고
 * 범위를 좁히면 만들 수 있는 값이 줄어든다.
 */
@Component
public class VerificationCodeGenerator {

    private final SecureRandom random = new SecureRandom();
    private final int length;

    public VerificationCodeGenerator(CredentialProperties properties) {
        this.length = properties.codeLength();
    }

    public String generate() {
        StringBuilder code = new StringBuilder(length);
        for (int index = 0; index < length; index++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }
}
