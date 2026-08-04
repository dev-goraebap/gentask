package dev.goraebap.devkit.auth.application.shared;

/**
 * 세션 토큰·OTP를 저장용 다이제스트로 바꾸는 포트 (설계/데이터베이스.md §1.4).
 *
 * <p>bcrypt가 아니라 HMAC인 이유: 조회가 결정적이어야 한다 — 같은 입력이 같은 다이제스트를 내야
 * 인덱스로 찾을 수 있다. 앱 시크릿이 키로 들어가므로 DB만으로는 복원할 수 없다.
 *
 * <p><b>용도를 인자로 받는 이유</b>는 {@link HmacPurpose}에 있다. 한 마디로, 용도를 빠뜨릴 수
 * 없게 만들려는 것이다 — 문자열을 앞에 붙이는 관례로 두면 호출부 하나가 잊는 순간 그 용도만
 * 조용히 다른 용도와 같은 공간을 쓰게 되고, 그것은 눈에 띄지 않는다.
 */
public interface TokenHasher {

    /** HMAC-SHA256, 소문자 hex 64자. 같은 값이라도 용도가 다르면 다른 결과가 나온다. */
    String hmac(HmacPurpose purpose, String value);
}
