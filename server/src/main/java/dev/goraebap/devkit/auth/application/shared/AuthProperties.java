package dev.goraebap.devkit.auth.application.shared;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * auth 모듈 설정. 시크릿은 환경변수 {@code AUTH_SECRET}으로 주입한다 (docs/references/보안.md) —
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
        return oauth.redirectBase();
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
        oauth = oauth == null ? Oauth.disabled() : oauth;
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

    /**
     * 소셜 로그인 (AUTH-02·03).
     *
     * <p>{@code startIp*}는 <b>로그인 시작 경로</b>({@code /oauth2/authorization/**})의 IP당 한도다.
     * 이 경로는 로그인 전이라 열려 있고, 한 번 호출될 때마다 인가 요청을 보관할 서블릿 세션이 하나씩
     * 생긴다 — 제한이 없으면 반복 호출만으로 힙을 고갈시킬 수 있다(보안 검토 F3).
     * 사람이 로그인 버튼을 누르는 빈도에 비해 넉넉하되, 자동화된 반복에는 걸리는 값으로 둔다.
     */
    public record Oauth(String redirectBase, int startIpLimit, Duration startIpWindow) {

        private static final int DEFAULT_START_IP_LIMIT = 20;
        private static final Duration DEFAULT_START_IP_WINDOW = Duration.ofMinutes(10);

        public Oauth {
            startIpLimit = startIpLimit <= 0 ? DEFAULT_START_IP_LIMIT : startIpLimit;
            startIpWindow = startIpWindow == null ? DEFAULT_START_IP_WINDOW : startIpWindow;
        }

        /** 소셜 로그인을 쓰지 않는 파생 프로젝트용 — 설정이 없어도 기동은 된다. */
        static Oauth disabled() {
            return new Oauth("", DEFAULT_START_IP_LIMIT, DEFAULT_START_IP_WINDOW);
        }
    }
}
