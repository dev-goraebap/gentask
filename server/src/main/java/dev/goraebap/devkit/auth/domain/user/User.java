package dev.goraebap.devkit.auth.domain.user;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * 사용자 애그리거트.
 *
 * <p>이 타입으로는 <b>미검증 사용자를 표현할 수 없다</b> — {@code emailVerifiedAt}이 항상 채워진다.
 * 소유 증명(OTP) 없이는 인스턴스가 생기지 않는 것이 결정-0015의 핵심 불변식이며, 스키마의
 * {@code email_verified_at NOT NULL}과 짝을 이룬다.
 */
public final class User {

    private final UUID id;
    private final EmailAddress email;
    private final Instant emailVerifiedAt;
    private final String nickname;
    private final Instant createdAt;
    private Instant updatedAt;

    private User(
            UUID id,
            EmailAddress email,
            Instant emailVerifiedAt,
            String nickname,
            Instant createdAt,
            Instant updatedAt) {
        this.id = Objects.requireNonNull(id);
        this.email = Objects.requireNonNull(email);
        this.emailVerifiedAt = Objects.requireNonNull(emailVerifiedAt, "소유가 증명되지 않은 사용자는 존재할 수 없다");
        this.nickname = nickname;
        this.createdAt = Objects.requireNonNull(createdAt);
        this.updatedAt = Objects.requireNonNull(updatedAt);
    }

    /** 소유 증명을 통과한 이메일로 사용자를 등록한다. 증명 시각이 곧 검증 시각이다. */
    public static User register(UUID id, EmailAddress email, Instant now) {
        return new User(id, email, now, null, now, now);
    }

    /** 저장소 전용 재구성. */
    public static User restore(
            UUID id,
            EmailAddress email,
            Instant emailVerifiedAt,
            String nickname,
            Instant createdAt,
            Instant updatedAt) {
        return new User(id, email, emailVerifiedAt, nickname, createdAt, updatedAt);
    }

    public UUID id() {
        return id;
    }

    public EmailAddress email() {
        return email;
    }

    public Instant emailVerifiedAt() {
        return emailVerifiedAt;
    }

    public String nickname() {
        return nickname;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }
}
