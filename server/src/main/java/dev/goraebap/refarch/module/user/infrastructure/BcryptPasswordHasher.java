package dev.goraebap.refarch.module.user.infrastructure;

import dev.goraebap.refarch.module.user.application.PasswordHasher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * BCrypt 기본 강도(10)다. Security 스타터 없이 spring-security-crypto 만 쓴다.
 *
 * 세션 토큰 해시(HMAC)와 다른 알고리즘인 이유: 비밀번호는 사람이 고른 낮은 엔트로피 값이라
 * 느린 해시가 필요하고, 토큰은 256비트 난수라 빠른 결정적 해시로 충분하다.
 */
@Component
class BcryptPasswordHasher implements PasswordHasher {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    public String hash(String rawPassword) {
        return encoder.encode(rawPassword);
    }

    @Override
    public boolean matches(String rawPassword, String passwordHash) {
        return encoder.matches(rawPassword, passwordHash);
    }
}
