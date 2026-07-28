package dev.goraebap.devkit.auth.application.registration;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

/** 가입 완료 응답. {@code token}은 Bearer 전달을 요청한 클라이언트에게만 실린다. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SignupResponse(UUID userId, String email, Instant sessionExpiresAt, String token) {}
