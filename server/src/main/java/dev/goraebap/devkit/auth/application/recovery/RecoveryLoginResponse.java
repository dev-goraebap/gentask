package dev.goraebap.devkit.auth.application.recovery;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

/**
 * 복구 로그인 응답 (AUTH-08).
 *
 * <p>{@code shouldSetPassword}가 참이면 화면이 비밀번호 설정을 권한다 — 인증 수단을 잃어 들어온
 * 사용자가 그대로 나가면 다음에 또 복구를 해야 한다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RecoveryLoginResponse(UUID userId, Instant sessionExpiresAt, boolean shouldSetPassword, String token) {}
