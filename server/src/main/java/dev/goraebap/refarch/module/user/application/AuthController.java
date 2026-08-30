package dev.goraebap.refarch.module.user.application;

import dev.goraebap.refarch.module.user.application.AuthService.IssuedSession;
import dev.goraebap.refarch.module.user.application.UserRequests.ConfirmPasswordReset;
import dev.goraebap.refarch.module.user.application.UserRequests.ConfirmSignup;
import dev.goraebap.refarch.module.user.application.UserRequests.Login;
import dev.goraebap.refarch.module.user.application.UserRequests.RequestPasswordReset;
import dev.goraebap.refarch.module.user.application.UserRequests.ResendCode;
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

    /** 가입을 시작한다. 계정은 아직 생기지 않고 그 주소로 코드가 간다. */
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @ApiResponse(responseCode = "202", description = "코드를 보냈다")
    public void signup(@Valid @RequestBody Signup signup) {
        authService.requestSignup(signup.email(), signup.password(), signup.nickname());
    }

    /** 코드를 확인하고 계정을 만든다. 끝나면 곧바로 로그인 상태다. */
    @PostMapping("/signup/confirm")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(responseCode = "201", description = "Created")
    public void confirmSignup(@Valid @RequestBody ConfirmSignup request, HttpServletResponse response) {
        IssuedSession session = authService.confirmSignup(request.email(), request.code());
        attach(response, session);
    }

    @PostMapping("/signup/resend")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void resendSignupCode(@Valid @RequestBody ResendCode request) {
        authService.resendSignupCode(request.email());
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

    /** 응답은 그 이메일의 등록 여부와 무관하게 같다. */
    @PostMapping("/password-reset")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void requestPasswordReset(@Valid @RequestBody RequestPasswordReset request) {
        authService.requestPasswordReset(request.email());
    }

    @PostMapping("/password-reset/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmPasswordReset(@Valid @RequestBody ConfirmPasswordReset request) {
        authService.confirmPasswordReset(request.email(), request.code(), request.newPassword());
    }

    @PostMapping("/password-reset/resend")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void resendPasswordResetCode(@Valid @RequestBody ResendCode request) {
        authService.resendPasswordResetCode(request.email());
    }

    private void attach(HttpServletResponse response, IssuedSession session) {
        response.addHeader(
                HttpHeaders.SET_COOKIE,
                sessionCookies
                        .issue(session.token(), session.expiresAt(), clock.instant())
                        .toString());
    }
}
