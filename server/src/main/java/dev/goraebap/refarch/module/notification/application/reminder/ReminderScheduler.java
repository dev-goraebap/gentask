package dev.goraebap.refarch.module.notification.application.reminder;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 미리 알림의 시각이 지났는지 주기적으로 본다.
 *
 * <p>주기를 1분으로 두는 것은 사용자가 고르는 값의 단위가 분이기 때문이다. 그보다 촘촘하게 돌아도
 * 알릴 것이 늘지 않고, 성기게 두면 고른 시각과 실제 알림 사이가 그만큼 벌어진다.
 *
 * <p>서버가 여럿이면 같은 알림을 여러 번 보내게 된다. 지금은 단일 서버 배포이며(품질 목표), 서버가
 * 늘면 이 자리에 잠금이 필요하다.
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
