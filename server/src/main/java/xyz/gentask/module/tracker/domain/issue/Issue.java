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
 * <p>번호는 프로젝트 안에서 평평하다. 부모의 번호를 앞에 달지 않는 것은, 소속을 번호로 읽으면 부모를
 * 바꿀 때 번호가 함께 바뀌어야 하는데 그 번호를 이미 커밋과 테스트가 가리키고 있기 때문이다. 계층은
 * {@code parentId} 가 갖는다(결정-0007).
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Issue {

    // 식별자
    @NonNull private final UUID id;

    // 담긴 프로젝트. 번호는 이 안에서만 유일하다
    @NonNull private final UUID projectId;

    // 프로젝트 안의 번호. 부여 뒤 바뀌지 않는다
    private final int number;

    // 유형
    @NonNull private IssueKind kind;

    // 상태
    @NonNull private IssueState state;

    // 제목
    @NonNull private IssueTitle title;

    // 본문. 인수 조건이 이 안에 있다
    @NonNull private IssueBody body;

    // 부모. 계층을 이것이 갖는다
    private UUID parentId;

    // 손으로 고친 목록의 순서
    private int ordinal;

    // 세운 사람
    @NonNull private final UUID authorId;

    // 기한
    private LocalDate dueDate;

    // 더 손대지 않는 자리로 옮긴 순간
    private Instant closedAt;

    // 만든 시각
    @NonNull private final Instant createdAt;

    // 고친 시각
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
     * 상태를 옮긴다.
     *
     * <p>닫힌 때가 상태를 따라간다. 닫힌 것을 되돌리면서 그 값을 남겨 두면 목록의 닫힘 판정과 상세의
     * 날짜가 서로 다른 것을 가리킨다(ITM-003 A2).
     *
     * <p>이미 그 상태이면 아무것도 바꾸지 않는다. 닫힌 때를 다시 찍으면 처음 닫은 순간을 잃는다.
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

    /** 부모를 잇는다. 번호는 따라 바뀌지 않는다. */
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
