package xyz.gentask.module.tracker.domain.issue;

/**
 * 작업 항목 진행 상태(BACKLOG, UNSTARTED, STARTED, COMPLETED, CANCELED) 열거형이다.
 */
public enum IssueState {
    BACKLOG,
    UNSTARTED,
    STARTED,
    COMPLETED,
    CANCELED,
    ;

    /** 작업 생성 시 기본 상태다. */
    public static final IssueState DEFAULT = BACKLOG;

    /** 작업이 종료(완료 또는 취소)된 상태인지 여부를 반환한다(ITM-003 A1). */
    public boolean isSettled() {
        return this == COMPLETED || this == CANCELED;
    }
}
