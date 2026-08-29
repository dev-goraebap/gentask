package dev.goraebap.refarch.module.user;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

/**
 * user 모듈이 제공하는 인터페이스(in). 사용자를 이름으로 보여 주어야 하는 모듈이 이 자리만 참조한다.
 *
 * <p>식별자를 이름으로 옮기는 일만 한다. 어느 사용자를 볼 자격이 있는지는 판정하지 않으며, 부르는 쪽이
 * 자기 규칙으로 이미 판정한 뒤 부른다.
 */
public interface Users {

    /**
     * 여럿을 한 번에 옮긴다. 목록 화면이 줄마다 부르면 조회가 줄 수만큼 늘기 때문이다.
     *
     * @return 찾은 것만 담는다. 지워진 사용자의 식별자는 결과에 없다
     */
    Map<UUID, UserBrief> findBriefs(Collection<UUID> userIds);
}
