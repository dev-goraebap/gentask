package xyz.gentask.module.notification.domain.failure;

import java.util.List;

/** 관리 화면의 알림 문제 목록을 읽는다. */
public interface PushFailureQuery {

    /**
     * 최근 일어난 것부터 한 쪽을 읽는다.
     *
     * @param includeResolved 처리됨으로 표시한 것도 함께 볼지
     */
    List<PushDeliveryFailure> search(boolean includeResolved, int limit, int offset);

    long count(boolean includeResolved);
}
