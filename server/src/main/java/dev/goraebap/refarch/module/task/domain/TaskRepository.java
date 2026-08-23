package dev.goraebap.refarch.module.task.domain;

import java.util.Optional;
import java.util.UUID;

/**
 * 작업 애그리거트의 저장소. 구현은 infrastructure 가 갖는다.
 *
 * <p><b>도메인 타입만 반환한다.</b> 화면 어휘의 타입이 필요해지는 순간 그것은 이 인터페이스가
 * 아니라 조회 포트의 일이다. ArchUnit 이 반환 타입으로 그 경계를 검사한다.
 */
public interface TaskRepository {

    /** 삽입과 갱신을 하나로 다룬다. 호출부가 존재 여부를 알 필요가 없다. */
    void save(Task task);

    Optional<Task> findById(UUID id);

    void deleteById(UUID id);
}
