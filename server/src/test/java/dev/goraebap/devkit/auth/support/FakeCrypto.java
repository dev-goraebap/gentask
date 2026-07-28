package dev.goraebap.devkit.auth.support;

import dev.goraebap.devkit.auth.application.shared.PasswordHasher;
import dev.goraebap.devkit.auth.application.shared.TokenHasher;

/** 단위 테스트용 가짜 해셔 — 결정적이고 읽을 수 있는 값을 낸다. */
public final class FakeCrypto {

    private FakeCrypto() {}

    public static TokenHasher tokenHasher() {
        return value -> "hmac(" + value + ")";
    }

    public static PasswordHasher passwordHasher() {
        return new PasswordHasher() {
            @Override
            public String hash(String rawPassword) {
                return "enc(" + rawPassword + ")";
            }

            @Override
            public boolean matches(String rawPassword, String passwordHash) {
                return hash(rawPassword).equals(passwordHash);
            }
        };
    }
}
