package dev.goraebap.devkit.auth.application.session;

import java.time.Instant;
import java.util.UUID;

/**
 * 방금 발급된 세션. {@code token}은 원문이며 이 흐름의 응답(쿠키 또는 본문)으로만 나가고 저장·로그
 * 어디에도 남지 않는다.
 */
public record IssuedSession(UUID sessionId, UUID userId, String token, Instant expiresAt) {

    /**
     * 토큰을 뺀 사본. 쿠키 경로의 응답 본문에 쓴다 — 쿠키로 이미 전달했으므로 본문에도 실으면
     * JS가 읽을 수 있는 자리에 토큰이 한 번 더 놓인다(결정-0014).
     */
    public IssuedSession withoutToken() {
        return new IssuedSession(sessionId, userId, null, expiresAt);
    }
}
