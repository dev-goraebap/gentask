package dev.goraebap.devkit.auth.application.shared;

import java.time.Duration;

/**
 * 인증 시도 rate limit 포트.
 *
 * <p>세 곳이 쓴다 — OTP 발급(결정-0015 §결정 3), OTP 확인, 로그인. 발급 제한만으로는 부족하다:
 * 확인·로그인은 코드/비밀번호를 <b>맞히려는</b> 시도이므로 대입 속도 자체를 제한해야 한다.
 *
 * <p>로그인 경로에서는 <b>비밀번호 해시 계산 이전에</b> 물어야 한다. bcrypt는 의도적으로 느리므로,
 * 차단을 해시 뒤에 두면 rate limit이 곧 CPU 고갈 DoS의 증폭기가 된다.
 */
public interface AttemptRateLimiter {

    /** 한도 안이면 true를 반환하며 카운터를 소비한다. 거부되면 소비하지 않는다. */
    boolean tryAcquire(String key, int limit, Duration window);

    /**
     * 카운터를 비운다. 인증에 <b>성공한</b> 뒤 그 계정의 실패 카운터를 되돌리는 데 쓴다.
     *
     * <p>성공까지 카운터에 쌓아두면 두 가지가 생긴다 — 정상 사용자가 여러 기기에서 로그인하다
     * 스스로 잠기고, 공격자가 남의 계정에 오답을 넣어 그 계정을 반복 잠글 수 있다.
     */
    void reset(String key);
}
