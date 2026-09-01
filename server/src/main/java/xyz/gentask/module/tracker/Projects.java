package xyz.gentask.module.tracker;

import java.util.UUID;

/**
 * tracker 모듈이 제공하는 인터페이스(in). 프로젝트를 세우는 일을 바깥 모듈이 부를 때 이 자리만 참조한다.
 *
 * <p>지금 부르는 곳은 계정을 만드는 자리 하나다. 프로젝트가 하나도 없는 계정은 트래커의 어느 자리에도
 * 들어가지 못하므로, 처음 여는 사람이 빈 화면을 먼저 지나지 않게 한다(PRJ-001 A3).
 */
public interface Projects {

    /**
     * 그 사람의 프로젝트를 하나 세우고 접두어를 낸다. 접두어는 이름에서 뽑는다.
     *
     * <p>UUID 가 아니라 접두어를 내는 것은 주소가 그것을 갖기 때문이다(PRJ-002).
     */
    String create(UUID ownerId, String name);
}
