package xyz.gentask.module.user.domain.user;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/** 관리 화면의 사용자 목록을 읽는다. */
public interface UserSummaryQuery {

    /**
     * 최근 가입 순으로 한 쪽을 읽는다.
     *
     * @param keyword 이메일과 별명에서 찾을 말. 비어 있으면 거르지 않는다
     */
    List<UserSummary> search(String keyword, int limit, int offset);

    long count(String keyword);

    /** 식별자로 여럿을 읽는다. 다른 모듈이 사용자를 이름으로 보여 줄 때 지난다. */
    List<UserSummary> findAllByIds(Collection<UUID> userIds);
}
