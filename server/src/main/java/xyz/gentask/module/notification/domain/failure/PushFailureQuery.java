package xyz.gentask.module.notification.domain.failure;

import java.util.List;

/** 관리자 화면용 웹 푸시 실패 목록 조회 포트다. */
public interface PushFailureQuery {

    /**
     * 웹 푸시 실패 이력을 최신순으로 페이징 조회한다.
     */
    List<PushDeliveryFailure> search(boolean includeResolved, int limit, int offset);

    long count(boolean includeResolved);
}
