package xyz.gentask.module.user.application.auth;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

/**
 * 보안 난수 생성기를 사용하여 지정된 자릿수의 숫자 일회용 인증 코드를 생성한다.
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
