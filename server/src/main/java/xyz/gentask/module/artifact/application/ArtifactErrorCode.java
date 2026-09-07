package xyz.gentask.module.artifact.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.gentask.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum ArtifactErrorCode implements ErrorCode {
    ARTIFACT_NOT_FOUND(HttpStatus.NOT_FOUND, "아티팩트를 찾을 수 없습니다"),
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "삭제할 수 있는 코멘트를 찾을 수 없습니다"),
    COMMENT_VERSION_CHANGED(HttpStatus.CONFLICT, "새 버전이 발행됐습니다. 최신 문서에서 코멘트를 작성해 주세요"),
    REVISION_NOT_FOUND(HttpStatus.NOT_FOUND, "개정을 찾을 수 없습니다"),
    FOLDER_NOT_FOUND(HttpStatus.NOT_FOUND, "폴더를 찾을 수 없습니다"),
    FOLDER_MOVE_INTO_DESCENDANT(HttpStatus.CONFLICT, "그 자리로는 옮길 수 없습니다");

    private final HttpStatus status;
    private final String message;
}
