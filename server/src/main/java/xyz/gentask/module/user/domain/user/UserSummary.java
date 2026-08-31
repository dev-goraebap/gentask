package xyz.gentask.module.user.domain.user;

import java.time.Instant;
import java.util.UUID;

/**
 * 관리 화면이 보는 사용자 한 줄.
 *
 * <p>애그리거트를 그대로 내지 않는 것은 목록이 요구하는 것과 규칙이 요구하는 것이 다르기 때문이다.
 * 목록은 읽기만 하며 불변식을 지킬 일이 없다.
 */
public record UserSummary(UUID id, String email, String nickname, Role role, Instant createdAt) {}
