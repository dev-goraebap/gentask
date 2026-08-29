package dev.goraebap.refarch.module.notification.domain.reminder;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 보낼 때가 된 미리 알림 하나. 작업이 어느 모듈의 것인지와 무관하게 알림이 필요로 하는 값만 담는다.
 *
 * @param taskId 작업의 식별자. 보냈다는 표시를 이 값으로 남긴다
 * @param userId 알릴 사람
 * @param title 알림에 실을 작업 제목
 * @param remindAt 사용자가 고른 시각. 시간대가 없는 값이며 서버의 시간대로 해석한다
 */
public record DueReminder(UUID taskId, UUID userId, String title, LocalDateTime remindAt) {}
