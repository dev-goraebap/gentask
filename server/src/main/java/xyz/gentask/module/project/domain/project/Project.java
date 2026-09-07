package xyz.gentask.module.project.domain.project;

import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

/**
 * 프로젝트 애그리거트 루트 엔터티다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class Project {

    @NonNull private final String id;

    @NonNull private final UUID ownerId;

    @NonNull private ProjectName name;

    @NonNull private ProjectKey key;

    @NonNull private final Instant createdAt;

    @NonNull private Instant updatedAt;

    public static Project create(String id, UUID ownerId, ProjectName name, ProjectKey key, Instant now) {
        return new Project(id, ownerId, name, key, now, now);
    }

    public static Project restore(
            String id, UUID ownerId, ProjectName name, ProjectKey key, Instant createdAt, Instant updatedAt) {
        return new Project(id, ownerId, name, key, createdAt, updatedAt);
    }

    public boolean isOwnedBy(@NonNull UUID candidateOwnerId) {
        return ownerId.equals(candidateOwnerId);
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
