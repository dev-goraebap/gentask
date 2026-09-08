package xyz.gentask.module.note.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.gentask.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum NoteErrorCode implements ErrorCode {
    NOTE_NOT_FOUND(HttpStatus.NOT_FOUND, "메모를 찾을 수 없습니다"),
    NOTE_OWNER_REQUIRED(HttpStatus.FORBIDDEN, "작성자만 메모를 변경할 수 있습니다"),
    NOTE_CONTENT_REQUIRED(HttpStatus.BAD_REQUEST, "내용이나 첨부파일을 추가해 주세요"),
    NOTE_PROJECT_REQUIRED(HttpStatus.BAD_REQUEST, "공유할 프로젝트를 먼저 선택해 주세요");
    private final HttpStatus status;
    private final String message;
}
