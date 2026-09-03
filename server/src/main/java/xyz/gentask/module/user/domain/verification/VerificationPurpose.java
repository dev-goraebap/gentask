package xyz.gentask.module.user.domain.verification;

/**
 * 일회용 인증 코드의 발급 목적 열거형이다.
 */
public enum VerificationPurpose {
    /** 회원 가입 이메일 소유 확인 목적이다. */
    SIGNUP,

    /** 비밀번호 재설정 본인 확인 목적이다. */
    PASSWORD_RESET
}
