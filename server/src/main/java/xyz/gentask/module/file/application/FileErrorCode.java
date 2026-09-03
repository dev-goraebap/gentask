package xyz.gentask.module.file.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.gentask.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum FileErrorCode implements ErrorCode {
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "붙인 파일을 찾을 수 없습니다"),

    FILE_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "붙일 수 있는 개수를 넘었습니다"),

    FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "허용 크기를 넘었습니다"),

    FILE_TYPE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "허용하지 않는 형식입니다"),

    FILE_NOT_UPLOADED(HttpStatus.BAD_REQUEST, "보관소에 올라간 파일이 없습니다"),

    // 미등록 첨부 대상 위치에 대한 요청인 경우 내부 설정 오류로 처리한다.
    FILE_OWNER_NOT_SUPPORTED(HttpStatus.INTERNAL_SERVER_ERROR, "첨부를 다룰 수 없는 자리입니다");

    private final HttpStatus status;
    private final String message;
}
