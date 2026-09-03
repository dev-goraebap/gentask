package xyz.gentask.module.user.domain.user;

import java.time.Instant;
import java.util.UUID;

/**
 * 관리자 화면용 사용자 요약 정보 모델이다.
 */
public record UserSummary(UUID id, String email, String nickname, Role role, Instant createdAt) {}
