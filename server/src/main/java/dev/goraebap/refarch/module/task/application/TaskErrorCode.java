package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.shared.error.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * task 모듈의 에러 코드.
 *
 * <p>이 모듈 고유의 사유만 담는다. 잘못된 요청 · 충돌 · 서버 오류는 {@code shared/error} 가 한 벌
 * 갖고 있으며 모듈마다 복제하지 않는다.
 *
 * <p>선언이 상수 목록과 필드 둘로 끝난다. 계약이 요구하는 {@code status()} 와 {@code message()}
 * 는 생성된 접근자가 그대로 만족한다.
 */
@Getter
@RequiredArgsConstructor
public enum TaskErrorCode implements ErrorCode {
    TASK_NOT_FOUND(HttpStatus.NOT_FOUND, "작업을 찾을 수 없습니다");

    private final HttpStatus status;
    private final String message;
}
