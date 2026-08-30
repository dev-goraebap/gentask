package dev.goraebap.refarch.module.user.domain.verification;

/**
 * 일회용 코드가 쓰이는 자리.
 *
 * <p>해시에 이 값을 결합하므로 같은 여섯 자리가 자리마다 서로 다른 값이 된다. 표의 유일 제약도 이
 * 값과 이메일의 쌍에 걸려, 한 주소가 두 자리에서 각각 하나씩 코드를 갖는다.
 */
public enum VerificationPurpose {
    /** 가입할 때 이메일 주소의 소유를 확인한다 */
    SIGNUP,

    /** 비밀번호를 모르는 상태에서 그 계정의 주인임을 확인한다 */
    PASSWORD_RESET
}
