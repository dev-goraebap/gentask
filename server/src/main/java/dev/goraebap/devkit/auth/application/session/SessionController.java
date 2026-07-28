package dev.goraebap.devkit.auth.application.session;

import dev.goraebap.devkit.auth.application.shared.AuthenticatedUser;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.application.shared.SessionCookieFactory;
import dev.goraebap.devkit.auth.application.shared.SessionTransport;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Clock;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
public class SessionController {

    private final SessionService sessionService;
    private final SessionQueryService sessionQueryService;
    private final SessionCookieFactory cookieFactory;
    private final Clock clock;

    public SessionController(
            SessionService sessionService,
            SessionQueryService sessionQueryService,
            SessionCookieFactory cookieFactory,
            Clock clock) {
        this.sessionService = sessionService;
        this.sessionQueryService = sessionQueryService;
        this.cookieFactory = cookieFactory;
        this.clock = clock;
    }

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
