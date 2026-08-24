package dev.goraebap.refarch.module.user.application;

import dev.goraebap.refarch.module.user.application.AuthService.IssuedSession;
import dev.goraebap.refarch.module.user.application.UserRequests.Login;
import dev.goraebap.refarch.module.user.application.UserRequests.Signup;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Clock;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * TK-005. 세션 토큰은 본문이 아니라 HttpOnly 쿠키로만 나간다 — 스크립트가 읽을 것이 없어야
 * XSS 가 세션을 들고 나가지 못한다. 에이전트용 토큰은 다른 자리(TK-006 A3)가 갖는다.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SessionCookies sessionCookies;
    private final Clock clock;

    /** TK-005 A1. 등록이 곧 로그인이라 응답에 세션 쿠키가 실린다. */
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "201", description = "Created")
    public void signup(@Valid @RequestBody Signup signup, HttpServletResponse response) {
        IssuedSession session = authService.signup(signup.email(), signup.password(), signup.nickname());
        attach(response, session);
    }

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void login(@Valid @RequestBody Login login, HttpServletResponse response) {
        IssuedSession session = authService.login(login.email(), login.password());
        attach(response, session);
    }

    /** TK-005 A4. Bearer(에이전트) 경로에는 세션이 없어 쿠키만 거둔다. */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        Object sessionId = request.getAttribute(AuthRequestAttributes.SESSION_ID);
        if (sessionId instanceof UUID id) {
            authService.logout(id);
        }
        response.addHeader(HttpHeaders.SET_COOKIE, sessionCookies.expire().toString());
    }

    private void attach(HttpServletResponse response, IssuedSession session) {
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                sessionCookies
                        .issue(session.token(), session.expiresAt(), clock.instant())
                        .toString());
    }
}
