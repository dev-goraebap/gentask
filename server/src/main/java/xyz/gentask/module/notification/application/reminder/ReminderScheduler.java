package xyz.gentask.module.notification.application.reminder;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 1분 주기로 도래한 작업 미리 알림을 발송하는 스케줄러 컴포넌트다.
 */
@Component
@RequiredArgsConstructor
class ReminderScheduler {

    private final ReminderDispatchService reminderDispatchService;

    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT30S")
    void dispatchDue() {
        reminderDispatchService.dispatchDue();
    }
}
