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

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SessionCookies sessionCookies;
    private final Clock clock;

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
