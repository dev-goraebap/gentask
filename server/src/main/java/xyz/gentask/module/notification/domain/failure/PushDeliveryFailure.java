package xyz.gentask.module.notification.domain.failure;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 알림이 닿지 않은 회차 하나.
 *
 * <p>구독의 식별자가 아니라 endpoint 를 그대로 담는다. 자리가 사라져 구독 행이 지워진 뒤에도 무엇이
 * 실패했는지 남아야 하기 때문이다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class PushDeliveryFailure {

    /** 왜 닿지 않았는가. */
    public enum Reason {
        /** 푸시 서비스가 거절했거나 부르는 도중 실패했다. 다음 회차가 다시 시도한다 */
        FAILED,
        /** 그 자리가 사라졌다. 시스템이 스스로 걷었으므로 관리자가 할 일이 없다 */
        GONE
    }

    // 식별자
    @NonNull private final UUID id;

    // 이 자리를 가진 사용자
    @NonNull private final UUID userId;

    // 닿지 않은 자리
    @NonNull private final String endpoint;

    // 어느 작업의 미리 알림이었는가. 작업이 지워지면 끊긴다
    private final UUID taskId;

    // 사유
    @NonNull private final Reason reason;

    // 사람이 읽을 짧은 설명
    private final String detail;

    // 일어난 시각
    @NonNull private final Instant occurredAt;

    // 관리자가 처리했다고 표시한 시각
    private Instant resolvedAt;

    public static PushDeliveryFailure occur(
            UUID id, UUID userId, String endpoint, UUID taskId, Reason reason, String detail, Instant now) {
        return new PushDeliveryFailure(id, userId, endpoint, taskId, reason, detail, now, null);
    }

    public static PushDeliveryFailure restore(
            UUID id,
            UUID userId,
            String endpoint,
            UUID taskId,
            Reason reason,
            String detail,
            Instant occurredAt,
            Instant resolvedAt) {
        return new PushDeliveryFailure(id, userId, endpoint, taskId, reason, detail, occurredAt, resolvedAt);
    }

    /** 이미 처리된 것을 다시 표시해도 처음의 시각을 지킨다. 처리 시점이 뒤로 밀리면 이력이 어긋난다. */
    public void resolve(Instant now) {
        if (resolvedAt == null) {
            resolvedAt = now;
        }
    }

    public boolean isResolved() {
        return resolvedAt != null;
    }
}
