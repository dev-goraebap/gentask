package dev.goraebap.devkit.auth.application.registration;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** OTP 발급 요청. */
public record IssueEmailVerificationRequest(
        @NotBlank @Email @Size(max = 320) String email) {}
