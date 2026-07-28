package dev.goraebap.devkit.auth.application.session;

import dev.goraebap.devkit.auth.application.shared.SessionTransport;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 로그인 요청. {@code transport}를 생략하면 웹 기본값(쿠키)이다. */
public record LoginRequest(
        @NotBlank @Email @Size(max = 320) String email,
        @NotBlank @Size(max = 200) String password,
        SessionTransport transport) {

    public SessionTransport transportOrDefault() {
        return transport == null ? SessionTransport.COOKIE : transport;
    }
}
