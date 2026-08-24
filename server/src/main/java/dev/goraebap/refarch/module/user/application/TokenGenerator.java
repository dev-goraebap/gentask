package dev.goraebap.refarch.module.user.application;

import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.stereotype.Component;

/** 세션과 에이전트 토큰의 원문. 256비트 난수를 base64url 로 편다 — 43자, 패딩 없음. */
@Component
public class TokenGenerator {

    private static final int TOKEN_BYTES = 32;

    private final SecureRandom random = new SecureRandom();

    public String generate() {
        byte[] bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
