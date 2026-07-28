package dev.goraebap.devkit.auth.application.shared;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * 자격증명 난수 생성기. CSPRNG({@link SecureRandom})만 쓴다 (결정-0015 §결정 3).
 *
 * <p>테스트는 이 클래스를 속이지 않는다 — 발급된 코드·토큰은 항상 출력 경로(메일·응답)에서
 * 관찰한다. 예측 가능한 난수를 만드는 우회로를 아예 두지 않기 위함이다.
 */
public class SecureTokenGenerator {

    private static final int SESSION_TOKEN_BYTES = 32;
    private static final int OTP_BOUND = 1_000_000;

    private final SecureRandom random = new SecureRandom();

    /** 256비트 불투명 세션 토큰, base64url. */
    public String sessionToken() {
        byte[] bytes = new byte[SESSION_TOKEN_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** 6자리 OTP, 앞자리 0 허용(zero-pad). */
    public String otpCode() {
        return "%06d".formatted(random.nextInt(OTP_BOUND));
    }
}
