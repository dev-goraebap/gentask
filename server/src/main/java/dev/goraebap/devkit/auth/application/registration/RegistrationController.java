package dev.goraebap.devkit.auth.application.registration;

import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.application.shared.SessionCookieFactory;
import dev.goraebap.devkit.auth.application.shared.SessionTransport;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.Clock;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 이메일 가입 (AUTH-01, 설계/서버.md §1.6).
 *
 * <ul>
 *   <li>{@code POST /api/v1/email-verifications} — OTP 발급 (이메일 → 대기 레코드 식별자)
 *   <li>{@code POST /api/v1/users} — 가입 완료 (식별자 + 코드 + 비밀번호 → 계정 + 세션)
 * </ul>
 */
@RestController
public class RegistrationController {

    private final RegistrationService registrationService;
    private final SessionCookieFactory cookieFactory;
    private final Clock clock;

    public RegistrationController(
            RegistrationService registrationService, SessionCookieFactory cookieFactory, Clock clock) {
        this.registrationService = registrationService;
        this.cookieFactory = cookieFactory;
        this.clock = clock;
    }

    @PostMapping("/api/v1/email-verifications")
    public ResponseEntity<EmailVerificationResponse> issue(
            @Valid @RequestBody IssueEmailVerificationRequest request, HttpServletRequest http) {
        UUID verificationId = registrationService.issueSignupVerification(request.email(), http.getRemoteAddr());
        // 발송은 비동기다 — 수락했을 뿐 완료를 보장하지 않는다 (결정-0016)
        return ResponseEntity.accepted().body(new EmailVerificationResponse(verificationId));
    }

    @PostMapping("/api/v1/users")
    public ResponseEntity<SignupResponse> signup(@Valid @RequestBody SignupRequest request, HttpServletRequest http) {
        SignupResult result = registrationService.completeSignup(
                request.verificationId(),
                request.code(),
                request.password(),
                ClientInfo.of(http.getRemoteAddr(), http.getHeader("User-Agent")));

        ResponseEntity.BodyBuilder response =
                ResponseEntity.status(HttpStatus.CREATED).location(URI.create("/api/v1/users/" + result.userId()));

        if (request.transportOrDefault() == SessionTransport.BEARER) {
            return response.body(new SignupResponse(
                    result.userId(),
                    result.email(),
                    result.session().expiresAt(),
                    result.session().token()));
        }
        return response.header(
                        HttpHeaders.SET_COOKIE,
                        cookieFactory
                                .issue(
                                        result.session().token(),
                                        result.session().expiresAt(),
                                        clock.instant())
                                .toString())
                .body(new SignupResponse(
                        result.userId(), result.email(), result.session().expiresAt(), null));
    }
}
