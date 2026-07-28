package dev.goraebap.devkit.auth.application.shared;

/**
 * 세션 토큰·OTP를 저장용 다이제스트로 바꾸는 포트 (설계/데이터베이스.md §1.4).
 *
 * <p>bcrypt가 아니라 HMAC인 이유: 조회가 결정적이어야 한다 — 같은 입력이 같은 다이제스트를 내야
 * 인덱스로 찾을 수 있다. 앱 시크릿이 키로 들어가므로 DB만으로는 복원할 수 없다.
 */
public interface TokenHasher {

    /** HMAC-SHA256, 소문자 hex 64자. */
    String hmac(String value);
}
