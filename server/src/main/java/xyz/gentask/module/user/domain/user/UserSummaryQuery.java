package xyz.gentask.module.user.domain.user;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/** 관리자 화면용 사용자 목록 조회 포트다. */
public interface UserSummaryQuery {

    /**
     * 사용자 목록을 최신 가입 순으로 페이징 조회한다.
     */
    List<UserSummary> search(String keyword, int limit, int offset);

    long count(String keyword);

    /** 다수의 사용자 식별자로 사용자 요약 정보 목록을 조회한다. */
    List<UserSummary> findAllByIds(Collection<UUID> userIds);
}
