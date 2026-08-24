package dev.goraebap.refarch.module.task.application;

import dev.goraebap.refarch.shared.error.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum TaskErrorCode implements ErrorCode {
    TASK_NOT_FOUND(HttpStatus.NOT_FOUND, "작업을 찾을 수 없습니다"),

    /** TK-003 A11. */
    TASK_FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "붙인 파일을 찾을 수 없습니다"),

    /** TK-003 A11 의 개수 상한. */
    TASK_FILE_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "파일은 작업당 5개까지입니다"),

    /** TK-003 A11 의 크기 상한. */
    TASK_FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "파일은 10MB 를 넘을 수 없습니다"),

    /** 확정하려는 키가 보관소에 없다. 올리기 전에 확정을 불렀거나 올리기가 실패한 경우다. */
    TASK_FILE_NOT_UPLOADED(HttpStatus.BAD_REQUEST, "보관소에 올라간 파일이 없습니다");

    private final HttpStatus status;
    private final String message;
}
