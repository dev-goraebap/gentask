package dev.goraebap.devkit.auth.domain.verification;

/**
 * 대기 레코드의 용도 (AUTH-06, 결정-0015 §결정 8).
 *
 * <p>조회는 항상 용도로 필터한다 — 한 용도로 발급된 코드가 다른 용도에 통과하면 그것만으로 계정
 * 탈취다.
 */
public enum VerificationPurpose {
    EMAIL_SIGNUP,
    EMAIL_CHANGE,
    PASSWORD_RESET,
    ACCOUNT_RECOVERY
}
