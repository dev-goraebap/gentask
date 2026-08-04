package dev.goraebap.devkit.auth.support;

import dev.goraebap.devkit.auth.application.shared.HmacPurpose;
import dev.goraebap.devkit.auth.application.shared.PasswordHasher;
import dev.goraebap.devkit.auth.application.shared.TokenHasher;

/** 단위 테스트용 가짜 해셔 — 결정적이고 읽을 수 있는 값을 낸다. */
public final class FakeCrypto {

    private FakeCrypto() {}

    /**
     * <b>용도를 결과에 반영한다.</b> 무시하면 진짜 구현이 가진 용도 분리(결정 F5)를 가짜가
     * 지워버려, 용도를 잘못 준 코드가 테스트를 통과한다.
     */
    public static TokenHasher tokenHasher() {
        return FakeCrypto::해시;
    }

    /** 테스트가 기대값을 만들 때 쓴다. 문자열을 손으로 조립하면 형식이 갈린다. */
    public static String 해시(HmacPurpose purpose, String value) {
        return "hmac(" + purpose.label() + ":" + value + ")";
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
