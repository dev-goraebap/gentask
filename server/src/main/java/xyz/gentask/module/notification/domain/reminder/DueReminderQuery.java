package xyz.gentask.module.notification.domain.reminder;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 보낼 때가 된 미리 알림을 찾는 조회 포트.
 *
 * <p>작업 표를 읽지만 task 모듈의 애그리거트를 다루지 않는다. 알림에 필요한 값만 뽑는 화면 조회에
 * 가까우며, 그 값들이 도메인 어휘가 아니라 알림의 어휘다.
 */
public interface DueReminderQuery {

    /**
     * 그 시각까지 도달한 미리 알림 가운데 아직 보내지 않은 것.
     *
     * @param until 이 시각(포함) 이전의 미리 알림을 찾는다
     * @param limit 한 번에 가져올 최대 개수. 밀린 것이 많아도 한 회차가 길어지지 않게 한다
     */
    List<DueReminder> findDue(LocalDateTime until, int limit);
}
