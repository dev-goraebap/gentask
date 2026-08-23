package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.module.task.domain.TaskTitle;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 요청 DTO 묶음. 컨트롤러 진입 시점에 Bean Validation 이 검증한다.
 *
 * <p>제약의 근거는 값 객체가 소유하고 여기서는 참조만 한다. 검증은 두 곳에서 실행되지만
 * <b>고칠 자리는 한 곳</b>이다. 이 검증은 HTTP 요청 경로를 지키고, 값 객체의 검증은 그 타입을
 * 만드는 모든 경로를 지킨다.
 */
public final class TaskRequests {

    private TaskRequests() {}

    public record CreateTask(
            @NotBlank(message = TaskTitle.REQUIRED) @Size(max = TaskTitle.MAX) String title) {}
}
