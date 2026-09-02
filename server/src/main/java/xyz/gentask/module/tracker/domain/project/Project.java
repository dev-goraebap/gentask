package xyz.gentask.module.tracker.domain.project;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 프로젝트.
 *
 * <p>트래커의 모든 자리가 이것 하나에 매인다. 계정을 만들 때 기본 프로젝트가 함께 선다(PRJ-001 A3).
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Project {

    // 식별자
    @NonNull private final UUID id;

    // 주소가 담는 값. 사람이 정하지 않고 시스템이 만들며 전역으로 유일하다
    @NonNull private final ProjectPublicId publicId;

    // 소유자. 프로젝트는 계정 단위로 격리된다 (PRJ-002 A2)
    @NonNull private final UUID ownerId;

    // 이름
    @NonNull private ProjectName name;

    // 작업 아이템 번호의 접두어. 사람이 정하며 이슈 이름에만 쓰인다
    @NonNull private ProjectKey key;

    // 다음에 내줄 번호
    private int nextNumber;

    // 만든 시각
    @NonNull private final Instant createdAt;

    // 고친 시각
    @NonNull private Instant updatedAt;

    public static Project create(
            UUID id, ProjectPublicId publicId, UUID ownerId, ProjectName name, ProjectKey key, Instant now) {
        return new Project(id, publicId, ownerId, name, key, 1, now, now);
    }

    public static Project restore(
            UUID id,
            ProjectPublicId publicId,
            UUID ownerId,
            ProjectName name,
            ProjectKey key,
            int nextNumber,
            Instant createdAt,
            Instant updatedAt) {
        return new Project(id, publicId, ownerId, name, key, nextNumber, createdAt, updatedAt);
    }

    public boolean isOwnedBy(@NonNull UUID candidateOwnerId) {
        return ownerId.equals(candidateOwnerId);
    }

    /**
     * 다음 번호를 내주고 그 자리를 한 칸 민다.
     *
     * <p>지금 있는 것의 최댓값을 세지 않는다. 그렇게 하면 마지막 것을 지운 뒤에 세운 항목이 지운 것의
     * 번호를 물려받고, 그 번호를 가리키던 커밋과 테스트가 다른 것을 가리키게 된다.
     */
    public int issueNumber(Instant now) {
        int issued = nextNumber;
        this.nextNumber = issued + 1;
        this.updatedAt = now;
        return issued;
    }

    public void rename(@NonNull ProjectName name, Instant now) {
        this.name = name;
        this.updatedAt = now;
    }

    /**
     * 접두어를 바꾼다.
     *
     * <p>이미 매겨진 번호는 따라 바뀌지 않는다. 접두어는 이름을 그리는 데만 쓰이고 번호는 표가 갖기
     * 때문이며, 옛 접두어로 적힌 커밋과 테스트는 그 시점의 이름으로 남는다.
     */
    public void changeKey(@NonNull ProjectKey key, Instant now) {
        this.key = key;
        this.updatedAt = now;
    }
}
