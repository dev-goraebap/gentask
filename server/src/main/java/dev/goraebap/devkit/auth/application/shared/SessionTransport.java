package dev.goraebap.devkit.auth.application.shared;

/**
 * 세션 토큰 전달 경로 (결정-0014 §결정 2). 세션 테이블은 하나고 전달 방식만 다르다 —
 * 웹은 HttpOnly 쿠키, 모바일·외부 클라이언트는 Bearer 헤더.
 */
public enum SessionTransport {
    COOKIE,
    BEARER
}
