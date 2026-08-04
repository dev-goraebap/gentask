package dev.goraebap.devkit.auth.application.sociallogin;

import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.application.shared.SessionCookieFactory;
import dev.goraebap.devkit.auth.application.shared.SessionTransport;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Clock;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 소셜 최초 로그인의 2단계 (AUTH-02·03·05).
 *
 * <p>1단계(제공자 인증)는 Spring Security가 처리하고 결과를 프론트로 리다이렉트한다 —
 * 이 컨트롤러가 받는 것은 그 이후다.
 *
 * <ul>
 *   <li>{@code POST /api/v1/social-logins/email} — 중간 표 + 이메일 → 대기 레코드 식별자
 *   <li>{@code POST /api/v1/social-logins/confirm} — 식별자 + 코드 → 계정 생성 + 세션
 * </ul>
 *
 * <p>둘 다 인증 없이 열려 있다. 아직 계정이 없는 사람을 위한 흐름이기 때문이며, 보호는 중간 표의
 * 서명과 OTP가 담당한다.
 */
@RestController
@RequestMapping("/api/v1/social-logins")
@RequiredArgsConstructor
public class SocialLoginController {

    private final SocialLoginService socialLoginService;
    private final SessionCookieFactory cookieFactory;
    private final SocialTicketCookieFactory ticketCookieFactory;
    private final Clock clock;

    /**
     * 표는 본문이 아니라 {@code HttpOnly} 쿠키에서 읽는다 (F1). 쿠키가 없으면 {@code null}이
     * 그대로 서비스로 가고 표 검증에서 걸린다 — 없는 것과 틀린 것을 구분해 알려주지 않는다.
     *
     * <p>성공하면 <b>쿠키를 지운다.</b> 표 하나로 대기 레코드를 여러 개 만들면 그 중 둘을 통과시켜
     * 유니크 제약 위반까지 밀어붙일 수 있다(F4). 한 번 쓴 표는 브라우저에서 사라진다.
     */
    @PostMapping("/email")
    public ResponseEntity<SocialLoginRequests.EmailResponse> requestEmail(
            @CookieValue(name = SocialTicketCookieFactory.COOKIE_NAME, required = false) String ticket,
            @Valid @RequestBody SocialLoginRequests.EmailRequest request,
            HttpServletRequest http) {
        UUID verificationId =
                socialLoginService.requestEmailVerification(ticket, request.email(), http.getRemoteAddr());
        return ResponseEntity.accepted()
                .header(HttpHeaders.SET_COOKIE, ticketCookieFactory.expire().toString())
                .body(new SocialLoginRequests.EmailResponse(verificationId));
    }

    @PostMapping("/confirm")
    public ResponseEntity<SocialLoginOutcome> confirm(
            @Valid @RequestBody SocialLoginRequests.ConfirmRequest request, HttpServletRequest http) {
        SocialLoginOutcome outcome = socialLoginService.completeSignup(
                request.verificationId(),
                request.code(),
                ClientInfo.of(http.getRemoteAddr(), http.getHeader("User-Agent")));

        if (request.transportOrDefault() == SessionTransport.BEARER) {
            return ResponseEntity.ok(outcome);
        }
        // 쿠키 경로에서는 토큰을 본문에 싣지 않는다 (결정-0014)
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookieFactory
                                .issue(
                                        outcome.session().token(),
                                        outcome.session().expiresAt(),
                                        clock.instant())
                                .toString())
                .body(SocialLoginOutcome.signedIn(
                        outcome.userId(), outcome.session().withoutToken()));
    }
}
