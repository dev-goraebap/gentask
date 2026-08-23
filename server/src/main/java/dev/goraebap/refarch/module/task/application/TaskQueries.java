package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.module.task.application.TaskViews.TaskView;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 조회 포트 — 이 모듈이 소유하고 infrastructure 가 구현한다.
 *
 * <p>포트가 화면 DTO 를 직접 반환한다. 도메인 보강이 필요한 조회에서만 중간 타입을 두며, 모든
 * 조회에 두 겹을 강제하면 그것이 새로운 형식이 된다.
 *
 * <p>이름을 {@code TaskQueryRepository} 로 짓지 않는다. 저장소는 애그리거트를 다루는 계약이고
 * 이것은 화면 구조를 만드는 계약이라 지키는 것이 다르다.
 */
public interface TaskQueries {

    /**
     * 만든 순서의 역순으로 가져온다. 방금 적은 것이 위에 온다.
     *
     * <p>필터와 정렬을 인자로 받지 않는 것은 화면이 아직 전량을 받아 걸러 내기 때문이다.
     * 목록이 커져 그 방식이 성립하지 않으면 조건을 이 포트로 내린다.
     */
    List<TaskView> findAll();

    Optional<TaskView> findOne(UUID id);
}
