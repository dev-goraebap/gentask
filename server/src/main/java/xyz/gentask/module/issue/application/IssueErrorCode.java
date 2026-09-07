package xyz.gentask.module.issue.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.gentask.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum IssueErrorCode implements ErrorCode {
    ISSUE_NOT_FOUND(HttpStatus.NOT_FOUND, "작업 아이템을 찾을 수 없습니다");

    private final HttpStatus status;
    private final String message;
}
