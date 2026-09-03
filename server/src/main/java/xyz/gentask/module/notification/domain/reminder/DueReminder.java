package xyz.gentask.module.notification.domain.reminder;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 발송 대상 작업 미리 알림 레코드다.
 */
public record DueReminder(UUID taskId, UUID userId, String title, LocalDateTime remindAt) {}
