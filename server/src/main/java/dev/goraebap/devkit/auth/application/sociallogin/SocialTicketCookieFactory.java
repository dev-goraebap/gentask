package dev.goraebap.devkit.auth.application.sociallogin;

import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;

/**
 * 중간 표를 담는 쿠키 (AUTH-02·03).
 *
 * <p><b>표를 URL 쿼리로 넘기지 않는 이유</b>가 이 클래스의 존재 이유다. 쿼리스트링에 실으면 표가
 * 우리 액세스 로그, 콜백 응답의 {@code Location} 헤더, 브라우저 히스토리, 페이지가 부르는 다른
 * 요청의 {@code Referer}에 남는다. 그 중 한 곳만 읽을 수 있어도 <b>남의 제공자 신원을 영구히
 * 선점</b>할 수 있다 — 표를 주운 사람이 <b>자기 이메일</b>로 소유 증명을 통과하면 "피해자의 구글
 * 계정 + 공격자의 이메일"인 계정이 만들어지고, 이후 피해자가 구글 로그인을 누를 때마다 공격자의
 * 계정으로 들어간다(보안 검토 F1).
 *
 * <p>표가 "훔쳐도 소용없는 배턴"이라는 원래 설명은 <b>피해자 이메일로 통과해야 한다</b>고 전제할
 * 때만 성립한다. 공격자는 그럴 필요가 없다. 그래서 표는 <b>훔치기 어려워야</b> 한다.
 *
 * <p>{@code HttpOnly}는 스크립트가 읽지 못하게 하고, {@code Path}를 소셜 로그인 경로로 좁혀
 * 다른 요청에 딸려 나가지 않게 하며, {@code SameSite=Lax}는 남의 사이트에서 시작된 POST에 이
 * 쿠키가 실리지 않게 한다. 제공자에서 우리 쪽으로 돌아오는 이동은 최상위 GET 탐색이므로 Lax에서도
 * 정상 전달된다.
 */
@RequiredArgsConstructor
public class SocialTicketCookieFactory {

    public static final String COOKIE_NAME = "social_ticket";

    /** 표 자체의 수명과 맞춘다 — 쿠키가 더 오래 살아 있을 이유가 없다. */
    private static final Duration MAX_AGE = PendingSocialTicketCodec.TTL;

    /** 이 쿠키를 받는 두 경로만 덮는다. 다른 API 요청에는 딸려 나가지 않는다. */
    private static final String PATH = "/api/v1/social-logins";

    private final AuthProperties properties;

    public ResponseCookie issue(String ticket) {
        return builder(ticket).maxAge(MAX_AGE).build();
    }

    /** 표를 한 번 쓰고 나면 지운다 — 같은 표로 대기 레코드를 여러 개 만드는 경로를 닫는다(F4). */
    public ResponseCookie expire() {
        return builder("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder builder(String value) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(properties.session().cookieSecure())
                .sameSite("Lax")
                .path(PATH);
    }
}
