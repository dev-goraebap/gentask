package dev.goraebap.refarch.module.user.domain;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 에이전트용 토큰 (TK-006 A3). 계정당 하나이며 재발급이 곧 교체다.
 *
 * 세션과 달리 만료가 없다. 에이전트 설정에 넣어 두는 값이라 조용히 죽으면 사용자는
 * 등록이 안 되는 이유를 알 수 없다. 끊는 수단은 재발급과 삭제다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class ApiToken {

    // 식별자
    @NonNull private final UUID id;

    // 소유자
    @NonNull private final UUID userId;

    // 토큰의 HMAC-SHA256 hex
    @NonNull private final String tokenHash;

    // 발급 시각
    @NonNull private final Instant createdAt;

    public static ApiToken issue(UUID id, UUID userId, String tokenHash, Instant now) {
        return new ApiToken(id, userId, tokenHash, now);
    }

    /** 저장소만 호출한다. 검증을 지나지 않는다. */
    public static ApiToken restore(UUID id, UUID userId, String tokenHash, Instant createdAt) {
        return new ApiToken(id, userId, tokenHash, createdAt);
    }
}
