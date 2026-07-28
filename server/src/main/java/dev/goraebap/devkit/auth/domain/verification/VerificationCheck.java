package dev.goraebap.devkit.auth.domain.verification;

/**
 * OTP 검증 시도의 결과. {@code ALREADY_CONSUMED}를 별도로 구분하는 이유는 같은 코드의 재사용
 * 시도를 "만료"가 아니라 "이미 사용됨"으로 감지·기록하기 위해서다 (설계/데이터베이스.md §2.4).
 */
public enum VerificationCheck {
    OK,
    EXPIRED,
    ALREADY_CONSUMED,
    ATTEMPTS_EXCEEDED,
    CODE_MISMATCH
}
