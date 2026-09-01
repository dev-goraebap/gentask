package xyz.gentask.module.tracker.domain.issue;

/**
 * 작업 아이템의 유형.
 *
 * <p>넷이 한 표에 있다. 담는 것이 같고 계층으로만 갈리기 때문이다. {@code TASK} 는 투두 모드의 할 일과
 * 다른 것이다 — 그쪽은 개인의 할 일이고 이쪽은 프로젝트에 속한 작업 아이템의 한 유형이다.
 */
public enum IssueKind {
    EPIC,
    STORY,
    TASK,
    BUG,
    ;

    /** 고르지 않고 세우면 이것이다 (ITM-001 A2). */
    public static final IssueKind DEFAULT = TASK;
}
