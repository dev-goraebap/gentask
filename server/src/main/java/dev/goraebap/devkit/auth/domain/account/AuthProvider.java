package dev.goraebap.devkit.auth.domain.account;

import java.util.Locale;

/**
 * 인증 제공자. 로컬 인증도 하나의 제공자({@code credential})로 다룬다 (AUTH-06).
 *
 * <p>DB에는 소문자 문자열로 저장한다. 값 집합은 스키마가 아니라 이 enum이 소유한다 — 파생
 * 프로젝트가 제공자를 추가할 때 마이그레이션 없이 여기에만 더한다 (설계/데이터베이스.md §2.3).
 */
public enum AuthProvider {
    CREDENTIAL,
    GOOGLE,
    KAKAO,
    NAVER;

    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static AuthProvider fromValue(String value) {
        return valueOf(value.toUpperCase(Locale.ROOT));
    }
}
