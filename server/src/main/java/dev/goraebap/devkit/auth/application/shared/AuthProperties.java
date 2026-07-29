package dev.goraebap.devkit.auth.application.shared;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * auth 모듈 설정. 시크릿은 환경변수 {@code AUTH_SECRET}으로 주입한다 (설계/서버.md §8) —
 * 저장소에 기본값을 두지 않으며, 주입이 없으면 기동에 실패한다.
 *
 * <p>OTP의 만료·시도 한도는 여기 없다 — 보안 파라미터로서 도메인 상수다
 * ({@code Verification.TTL}·{@code MAX_ATTEMPTS}, 결정-0015 §결정 3). 운영 설정으로 두는 것은
 * 요청 빈도 제한뿐이다.
 */
@ConfigurationProperties(prefix = "auth")
public record AuthProperties(
        String secret, Session session, Otp otp, Login login, List<String> allowedOrigins, Oauth oauth) {

    /** 소셜 로그인을 마친 브라우저를 되돌려보낼 곳. 화면이 이어서 처리한다 (AUTH-02·03). */
    public String oauthRedirectBase() {
        return oauth == null ? "" : oauth.redirectBase();
    }

    /** HMAC 키로 쓰기에 충분한 길이. 짧은 키는 키트를 그대로 배포한 파생 프로젝트에서 사고가 된다. */
    private static final int MIN_SECRET_LENGTH = 32;

    public AuthProperties {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("auth.secret이 비어 있다 — AUTH_SECRET 환경변수를 주입하라");
        }
        if (secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalArgumentException("auth.secret은 " + MIN_SECRET_LENGTH + "자 이상이어야 한다");
        }
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
    }

    /** 세션 수명과 쿠키 속성 (결정-0014). */
    public record Session(
            Duration ttl, Duration absoluteTtl, Duration touchInterval, String cookieName, boolean cookieSecure) {}

    /**
     * OTP 요청 제한 (결정-0015 §결정 3).
     *
     * <p><b>비대칭이 방향을 가진다 — IP는 촘촘히, 이메일은 넉넉히.</b> 이메일별을 조이면 공격자가
     * 남의 주소로 한도를 소진시켜 정상 가입과 재발송을 막는 서비스 거부가 된다. 이 값을 바꿀 때는
     * 두 한도의 대소 관계를 뒤집지 않는지 확인하라.
     */
    public record Otp(
            int issueIpLimit,
            Duration issueIpWindow,
            int issueEmailLimit,
            Duration issueEmailWindow,
            int confirmIpLimit,
            Duration confirmIpWindow) {}

    /** 로그인 시도 제한 — 크리덴셜 스터핑과 bcrypt CPU 고갈을 함께 막는다. */
    public record Login(int ipLimit, Duration ipWindow, int accountLimit, Duration accountWindow) {}

    /** 소셜 로그인 (AUTH-02·03). */
    public record Oauth(String redirectBase) {}
}
