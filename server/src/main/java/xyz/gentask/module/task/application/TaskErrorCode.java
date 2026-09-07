package xyz.gentask.module.task.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.gentask.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum TaskErrorCode implements ErrorCode {
    PROJECT_TASK_REQUIRED(HttpStatus.BAD_REQUEST, "프로젝트 작업에만 담당자를 지정할 수 있습니다"),
    PERSONAL_SETTING_ONLY(HttpStatus.BAD_REQUEST, "개인 작업에만 설정할 수 있습니다"),
    TASK_NOT_FOUND(HttpStatus.NOT_FOUND, "작업을 찾을 수 없습니다"),
    ;

    private final HttpStatus status;
    private final String message;
}
