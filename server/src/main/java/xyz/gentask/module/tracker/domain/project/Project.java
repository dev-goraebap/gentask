package xyz.gentask.module.tracker.domain.project;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 트래커 프로젝트 애그리거트 루트 엔터티다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Project {

    @NonNull private final UUID id;

    @NonNull private final ProjectPublicId publicId;

    @NonNull private final UUID ownerId;

    @NonNull private ProjectName name;

    @NonNull private ProjectKey key;

    private int nextNumber;

    @NonNull private final Instant createdAt;

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
     * 다음 작업 항목 일련번호를 발급하고 내부 카운터를 1 증가시킨다.
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
     * 작업 항목 키 접두어를 변경한다. 기존 발급된 일련번호는 유지된다.
     */
    public void changeKey(@NonNull ProjectKey key, Instant now) {
        this.key = key;
        this.updatedAt = now;
    }
}
