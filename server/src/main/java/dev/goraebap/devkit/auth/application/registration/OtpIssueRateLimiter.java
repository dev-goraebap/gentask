package dev.goraebap.devkit.auth.application.registration;

/**
 * OTP 발송 rate limit 포트 (결정-0015 §결정 3).
 *
 * <p>비대칭으로 건다 — IP별을 촘촘히, 이메일별은 넉넉히. 이메일별만 조이면 공격자가 한도를
 * 소진시켜 정상 가입을 막는 서비스 거부가 된다.
 */
public interface OtpIssueRateLimiter {

    /** 발급을 허용하면 true. 허용 시 두 카운터(IP·이메일)를 함께 소비한다. */
    boolean tryAcquire(String ipAddress, String emailNormalized);
}
