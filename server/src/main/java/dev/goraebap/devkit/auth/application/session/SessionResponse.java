package dev.goraebap.devkit.auth.application.session;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

/**
 * 세션 발급 응답. {@code token}은 Bearer 전달을 요청한 클라이언트에게만 실린다 — 쿠키 경로에서는
 * 토큰이 본문에 나가지 않아 XSS가 읽을 것이 없다 (결정-0014).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SessionResponse(UUID userId, Instant expiresAt, String token) {}
