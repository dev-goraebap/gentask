package dev.goraebap.devkit.auth.application.registration;

import java.util.UUID;

/**
 * OTP 발급 응답 — 계정 존재 여부와 무관하게 항상 이 형태다 (설계/서버.md §1.6).
 *
 * <p>{@code verificationId}는 검증 호출에 필요한 핸들이며 인증 자격이 아니다 — 이것으로 세션을
 * 얻을 수 없다.
 */
public record EmailVerificationResponse(UUID verificationId) {}
