package dev.goraebap.refarch.module.file.application;

import dev.goraebap.refarch.shared.error.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum FileErrorCode implements ErrorCode {
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "붙인 파일을 찾을 수 없습니다"),

    FILE_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "붙일 수 있는 개수를 넘었습니다"),

    FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "허용 크기를 넘었습니다"),

    FILE_TYPE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "허용하지 않는 형식입니다"),

    FILE_NOT_UPLOADED(HttpStatus.BAD_REQUEST, "보관소에 올라간 파일이 없습니다"),

    // 첨부를 붙이려는 자리가 어느 도메인에도 등록되지 않았다. 배선 결함이며 요청의 잘못이 아니다
    FILE_OWNER_NOT_SUPPORTED(HttpStatus.INTERNAL_SERVER_ERROR, "첨부를 다룰 수 없는 자리입니다");

    private final HttpStatus status;
    private final String message;
}
