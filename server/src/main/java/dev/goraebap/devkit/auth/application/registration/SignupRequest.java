package dev.goraebap.devkit.auth.application.registration;

import dev.goraebap.devkit.auth.application.shared.SessionTransport;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * 가입 완료 요청. 비밀번호 상한 72는 bcrypt가 그 이상을 무시하기 때문이다 — 초과 입력을 조용히
 * 자르는 대신 거부한다.
 */
public record SignupRequest(
        @NotNull UUID verificationId,
        @NotBlank @Pattern(regexp = "\\d{6}") String code,
        @NotBlank @Size(min = 8, max = 72) String password,
        SessionTransport transport) {

    public SessionTransport transportOrDefault() {
        return transport == null ? SessionTransport.COOKIE : transport;
    }
}
