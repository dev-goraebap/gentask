package xyz.gentask.module.tracker.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.gentask.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum TrackerErrorCode implements ErrorCode {
    // 남의 것도 없는 것으로 본다. 있으나 권한이 없다고 알리면 무엇이 존재하는지가 새어 나간다
    // (PRJ-002 A2 · ITM-003 A4).
    PROJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다"),
    ISSUE_NOT_FOUND(HttpStatus.NOT_FOUND, "작업 아이템을 찾을 수 없습니다"),
    DOCUMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "문서를 찾을 수 없습니다"),
    REVISION_NOT_FOUND(HttpStatus.NOT_FOUND, "개정을 찾을 수 없습니다"),
    FOLDER_NOT_FOUND(HttpStatus.NOT_FOUND, "폴더를 찾을 수 없습니다"),

    // 요청의 모양이 아니라 지금 트리의 생김새가 이 옮김을 허용하지 않는다. 고리가 생기면 그 안의
    // 폴더는 최상위에서 내려가는 어느 길로도 닿지 않는다(DOC-008 A6).
    FOLDER_MOVE_INTO_DESCENDANT(HttpStatus.CONFLICT, "그 자리로는 옮길 수 없습니다"),
    ;

    private final HttpStatus status;
    private final String message;
}
