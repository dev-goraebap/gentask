package dev.goraebap.devkit.auth.application.sociallogin;

import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.application.shared.SessionCookieFactory;
import dev.goraebap.devkit.auth.application.shared.SessionTransport;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Clock;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
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
public class SocialLoginController {

    private final SocialLoginService socialLoginService;
    private final SessionCookieFactory cookieFactory;
    private final Clock clock;

    public SocialLoginController(
            SocialLoginService socialLoginService, SessionCookieFactory cookieFactory, Clock clock) {
        this.socialLoginService = socialLoginService;
        this.cookieFactory = cookieFactory;
        this.clock = clock;
    }

    @PostMapping("/email")
    public ResponseEntity<SocialLoginRequests.EmailResponse> requestEmail(
            @Valid @RequestBody SocialLoginRequests.EmailRequest request, HttpServletRequest http) {
        UUID verificationId =
                socialLoginService.requestEmailVerification(request.ticket(), request.email(), http.getRemoteAddr());
        return ResponseEntity.accepted().body(new SocialLoginRequests.EmailResponse(verificationId));
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
