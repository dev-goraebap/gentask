package xyz.gentask.module.tracker.domain.issue;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 작업 아이템.
 *
 * 번호는 프로젝트 안에서 평평하다. 부모의 번호를 앞에 달지 않는 것은, 소속을 번호로 읽으면 부모를
 * 바꿀 때 번호가 함께 바뀌어야 하는데 그 번호를 이미 커밋과 테스트가 가리키고 있기 때문이다. 계층은
 * parentId 가 갖는다(결정-0007).
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Issue {

    @NonNull private final UUID id;

    @NonNull private final UUID projectId;

    private final int number;

    @NonNull private IssueKind kind;

    @NonNull private IssueState state;

    @NonNull private IssueTitle title;

    @NonNull private IssueBody body;

    private UUID parentId;
    private int ordinal;

    @NonNull private final UUID authorId;

    private LocalDate dueDate;
    private Instant closedAt;

    @NonNull private final Instant createdAt;

    @NonNull private Instant updatedAt;

    public static Issue create(
            UUID id,
            UUID projectId,
            int number,
            IssueKind kind,
            IssueTitle title,
            IssueBody body,
            UUID authorId,
            int ordinal,
            Instant now) {
        return new Issue(
                id,
                projectId,
                number,
                kind,
                IssueState.DEFAULT,
                title,
                body,
                null,
                ordinal,
                authorId,
                null,
                null,
                now,
                now);
    }

    public static Issue restore(
            UUID id,
            UUID projectId,
            int number,
            IssueKind kind,
            IssueState state,
            IssueTitle title,
            IssueBody body,
            UUID parentId,
            int ordinal,
            UUID authorId,
            LocalDate dueDate,
            Instant closedAt,
            Instant createdAt,
            Instant updatedAt) {
        return new Issue(
                id, projectId, number, kind, state, title, body, parentId, ordinal, authorId, dueDate, closedAt,
                createdAt, updatedAt);
    }

    public boolean belongsTo(@NonNull UUID candidateProjectId) {
        return projectId.equals(candidateProjectId);
    }

    /**
     * 작업 항목 상태를 변경한다.
     * 종료 상태(완료 또는 취소) 전환 시 종료 시각을 기록하며, 미종료 상태로 복원 시 종료 시각을 null로 초기화한다(ITM-003 A2).
     */
    public void changeState(@NonNull IssueState state, Instant now) {
        if (this.state == state) {
            return;
        }
        this.state = state;
        this.closedAt = state.isSettled() ? now : null;
        this.updatedAt = now;
    }

    public void changeTitle(@NonNull IssueTitle title, Instant now) {
        this.title = title;
        this.updatedAt = now;
    }

    public void changeBody(@NonNull IssueBody body, Instant now) {
        this.body = body;
        this.updatedAt = now;
    }

    public void changeKind(@NonNull IssueKind kind, Instant now) {
        this.kind = kind;
        this.updatedAt = now;
    }

    /** 상위 작업 항목을 변경하거나 최상위 작업으로 전환한다. */
    public void changeParent(UUID parentId, Instant now) {
        this.parentId = parentId;
        this.updatedAt = now;
    }

    public void changeDueDate(LocalDate dueDate, Instant now) {
        this.dueDate = dueDate;
        this.updatedAt = now;
    }

    public void changeOrdinal(int ordinal, Instant now) {
        this.ordinal = ordinal;
        this.updatedAt = now;
    }
}
