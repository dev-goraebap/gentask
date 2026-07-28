package dev.goraebap.devkit.auth.application.session;

import java.time.Instant;
import java.util.UUID;

/**
 * 방금 발급된 세션. {@code token}은 원문이며 이 흐름의 응답(쿠키 또는 본문)으로만 나가고 저장·로그
 * 어디에도 남지 않는다.
 */
public record IssuedSession(UUID sessionId, UUID userId, String token, Instant expiresAt) {}
