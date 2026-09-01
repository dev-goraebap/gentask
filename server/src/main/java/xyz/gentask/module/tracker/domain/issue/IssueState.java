package xyz.gentask.module.tracker.domain.issue;

/**
 * 작업 아이템의 상태 다섯.
 *
 * <p>가르는 축이 착수 여부가 아니라 <b>하기로 정했는가</b>다 — {@code BACKLOG} 와 {@code UNSTARTED} 는
 * 둘 다 시작하지 않은 것이며, 앞은 아직 정하지 않은 것이고 뒤는 정했으나 손대지 않은 것이다.
 *
 * <p>{@code COMPLETED} 는 인수 조건이 참임을 확인한 것이고 {@code CANCELED} 는 근거를 잃어 더 이상
 * 유효하지 않은 것이다. 둘 다 더 손대지 않는 자리이므로 닫힌 때를 함께 갖는다.
 */
public enum IssueState {
    BACKLOG,
    UNSTARTED,
    STARTED,
    COMPLETED,
    CANCELED,
    ;

    /** 세우면 이 상태다. 아직 하기로 정한 것이 아니다. */
    public static final IssueState DEFAULT = BACKLOG;

    /** 더 손댈 것이 없는 자리인가. 그 순간이 닫힌 때로 남는다 (ITM-003 A1). */
    public boolean isSettled() {
        return this == COMPLETED || this == CANCELED;
    }
}
