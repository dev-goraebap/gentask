package dev.goraebap.refarch.module.task.application;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 작업 조회 응답 묶음. 화면이 그대로 쓰는 형태다.
 *
 * <p>record 하나에 파일 하나를 두면 작은 타입이 폴더를 채우고, 그 폴더를 열어야 이 모듈이
 * 무엇을 내보내는지 알 수 있다. 묶어 두면 목록 전체가 한 화면에 보인다.
 */
public final class TaskViews {

    private TaskViews() {}

    /**
     * 목록과 상세가 같은 형태를 쓴다. 둘을 미리 나누면 필드 하나가 늘 때마다 두 곳을 고치게
     * 되는데, 지금 상세에만 있는 것이 없다. 갈리는 시점에 나눈다.
     *
     * <p>{@code remindAt} 이 {@code LocalDateTime} 인 것은 그 값이 절대 순간이 아니기 때문이다.
     * 사용자가 고른 것은 "그 날 그 시각" 이며, 시간대를 붙이면 고른 값과 저장된 값이 달라진다.
     */
    public record TaskView(
            UUID id,
            String title,
            String note,
            LocalDate dueDate,
            LocalDateTime remindAt,
            boolean important,
            LocalDate myDayOn,
            Instant completedAt,
            Instant createdAt) {}
}
