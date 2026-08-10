package dev.goraebap.devkit.auth.application.registration;

import dev.goraebap.devkit.auth.application.session.IssuedSession;
import java.util.UUID;

/** 가입 완료 결과 — 명령이 만들어낸 것만 담는다 (docs/references/조회와-명령.md §4의 (a)). */
public record SignupResult(UUID userId, String email, IssuedSession session) {}
