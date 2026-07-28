package dev.goraebap.devkit.auth.application.shared;

import java.util.UUID;

/** 인증 필터가 SecurityContext에 싣는 주체. 컨트롤러는 이것으로 현재 사용자·세션을 식별한다. */
public record AuthenticatedUser(UUID userId, UUID sessionId, SessionTransport transport) {}
