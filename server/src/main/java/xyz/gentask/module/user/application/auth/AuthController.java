package xyz.gentask.module.user.application.auth;

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
import xyz.gentask.module.user.application.AuthRequestAttributes;
import xyz.gentask.module.user.application.UserRequests.ConfirmLogin;
import xyz.gentask.module.user.application.UserRequests.ResendCode;
import xyz.gentask.module.user.application.auth.AuthService.IssuedSession;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailLoginService emailLogin;
    private final SessionCookies sessionCookies;
    private final Clock clock;

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        Object sessionId = request.getAttribute(AuthRequestAttributes.SESSION_ID);
        if (sessionId instanceof UUID id) {
            authService.logout(id);
        }
        response.addHeader(HttpHeaders.SET_COOKIE, sessionCookies.expire().toString());
    }

    @PostMapping("/login/code")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void requestLoginCode(@Valid @RequestBody ResendCode request) {
        emailLogin.request(request.email());
    }

    @PostMapping("/login/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmLogin(@Valid @RequestBody ConfirmLogin request, HttpServletResponse response) {
        attach(response, emailLogin.confirm(request.email(), request.code()));
    }

    private void attach(HttpServletResponse response, IssuedSession session) {
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                sessionCookies
                        .issue(session.token(), session.expiresAt(), clock.instant())
                        .toString());
    }
}
