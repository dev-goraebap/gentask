package dev.goraebap.devkit.auth.application.session;

import java.time.Instant;
import java.util.UUID;

/** 현재 세션 화면 DTO. 포트가 직접 반환한다 (docs/references/조회와-명령.md §1). */
public record CurrentSessionView(UUID userId, String email, String nickname, Instant expiresAt) {}
