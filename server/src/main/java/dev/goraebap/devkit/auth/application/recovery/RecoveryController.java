package dev.goraebap.devkit.auth.application.recovery;

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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 로그인할 수 없는 상태의 복구 (AUTH-07·08).
 *
 * <ul>
 *   <li>{@code POST /api/v1/password-resets} — 재설정 코드 발급
 *   <li>{@code POST /api/v1/password-resets/confirm} — 새 비밀번호 설정 (전 세션 무효화)
 *   <li>{@code POST /api/v1/account-recoveries} — 복구 코드 발급
 *   <li>{@code POST /api/v1/account-recoveries/confirm} — 복구 로그인 (세션 신규 발급)
 * </ul>
 *
 * <p>발급 두 경로는 인증 없이 열려 있다. 확인 두 경로도 마찬가지다 — 로그인할 수 없는 사용자를
 * 위한 흐름이므로 세션을 요구할 수 없다. 보호는 OTP와 시도 제한이 담당한다.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RecoveryController {

    private final RecoveryService recoveryService;
    private final SessionCookieFactory cookieFactory;
    private final Clock clock;

    @PostMapping("/password-resets")
    public ResponseEntity<RecoveryRequests.IssueResponse> issuePasswordReset(
            @Valid @RequestBody RecoveryRequests.IssueRequest request, HttpServletRequest http) {
        UUID verificationId = recoveryService.issuePasswordReset(request.email(), http.getRemoteAddr());
        return ResponseEntity.accepted().body(new RecoveryRequests.IssueResponse(verificationId));
    }

    @PostMapping("/password-resets/confirm")
    public ResponseEntity<Void> confirmPasswordReset(
            @Valid @RequestBody RecoveryRequests.ResetPasswordRequest request, HttpServletRequest http) {
        recoveryService.completePasswordReset(
                request.verificationId(), request.code(), request.newPassword(), http.getRemoteAddr());
        // 전 세션이 무효화됐으므로 이 요청에 쿠키가 실려 있었다면 그것도 이미 죽었다 — 함께 지운다
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookieFactory.expire().toString())
                .build();
    }

    @PostMapping("/account-recoveries")
    public ResponseEntity<RecoveryRequests.IssueResponse> issueAccountRecovery(
            @Valid @RequestBody RecoveryRequests.IssueRequest request, HttpServletRequest http) {
        UUID verificationId = recoveryService.issueAccountRecovery(request.email(), http.getRemoteAddr());
        return ResponseEntity.accepted().body(new RecoveryRequests.IssueResponse(verificationId));
    }

    @PostMapping("/account-recoveries/confirm")
    public ResponseEntity<RecoveryLoginResponse> confirmAccountRecovery(
            @Valid @RequestBody RecoveryRequests.RecoverLoginRequest request, HttpServletRequest http) {
        RecoveryLoginResult result = recoveryService.completeAccountRecovery(
                request.verificationId(),
                request.code(),
                ClientInfo.of(http.getRemoteAddr(), http.getHeader("User-Agent")));

        boolean shouldSetPassword = !result.hasPassword();
        if (request.transportOrDefault() == SessionTransport.BEARER) {
            return ResponseEntity.ok(new RecoveryLoginResponse(
                    result.userId(),
                    result.session().expiresAt(),
                    shouldSetPassword,
                    result.session().token()));
        }
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookieFactory
                                .issue(
                                        result.session().token(),
                                        result.session().expiresAt(),
                                        clock.instant())
                                .toString())
                .body(new RecoveryLoginResponse(
                        result.userId(), result.session().expiresAt(), shouldSetPassword, null));
    }
}
