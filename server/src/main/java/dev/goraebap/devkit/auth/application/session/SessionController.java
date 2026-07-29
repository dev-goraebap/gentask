package dev.goraebap.devkit.auth.application.session;

import dev.goraebap.devkit.auth.application.shared.AuthenticatedUser;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.application.shared.SessionCookieFactory;
import dev.goraebap.devkit.auth.application.shared.SessionTransport;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 세션 리소스 (AUTH-01, 결정-0014).
 *
 * <ul>
 *   <li>{@code POST /api/v1/sessions} — 로그인
 *   <li>{@code GET /api/v1/sessions/current} — 현재 세션 조회
 *   <li>{@code DELETE /api/v1/sessions/current} — 로그아웃 (즉시 무효화)
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final SessionQueryService sessionQueryService;
    private final SessionCookieFactory cookieFactory;
    private final Clock clock;

    @PostMapping
    public ResponseEntity<SessionResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        IssuedSession session = sessionService.login(
                request.email(), request.password(), ClientInfo.of(http.getRemoteAddr(), http.getHeader("User-Agent")));

        if (request.transportOrDefault() == SessionTransport.BEARER) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new SessionResponse(session.userId(), session.expiresAt(), session.token()));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookieFactory
                                .issue(session.token(), session.expiresAt(), clock.instant())
                                .toString())
                .body(new SessionResponse(session.userId(), session.expiresAt(), null));
    }

    @GetMapping("/current")
    public CurrentSessionView currentSession(@AuthenticationPrincipal AuthenticatedUser user) {
        return sessionQueryService.currentSession(user.sessionId());
    }

    /** 로그인된 기기 목록 (AUTH-06). 자기 것만 보인다 — 대상은 인증 주체에서 온다. */
    @GetMapping
    public List<UserSessionView> activeSessions(@AuthenticationPrincipal AuthenticatedUser user) {
        return sessionQueryService.activeSessions(user.userId(), user.sessionId());
    }

    /** 특정 기기 로그아웃 (AUTH-06). 지금 쓰는 세션을 지목하면 스스로 로그아웃된다. */
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> revokeSession(
            @PathVariable UUID sessionId, @AuthenticationPrincipal AuthenticatedUser user) {
        sessionService.revokeSession(sessionId, user.userId());

        ResponseEntity.HeadersBuilder<?> response = ResponseEntity.noContent();
        if (sessionId.equals(user.sessionId()) && user.transport() == SessionTransport.COOKIE) {
            // 자기 세션을 끊었으면 쿠키도 함께 지운다 — 죽은 토큰을 계속 들고 다닐 이유가 없다
            response.header(HttpHeaders.SET_COOKIE, cookieFactory.expire().toString());
        }
        return response.build();
    }

    @DeleteMapping("/current")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal AuthenticatedUser user) {
        sessionService.logout(user.sessionId());
        ResponseEntity.HeadersBuilder<?> response = ResponseEntity.noContent();
        if (user.transport() == SessionTransport.COOKIE) {
            response.header(HttpHeaders.SET_COOKIE, cookieFactory.expire().toString());
        }
        return response.build();
    }
}
