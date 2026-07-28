package dev.goraebap.devkit.auth.infrastructure.repository;

import static dev.goraebap.devkit.jooq.Tables.USERS;

import dev.goraebap.devkit.auth.domain.user.EmailAddress;
import dev.goraebap.devkit.auth.domain.user.User;
import dev.goraebap.devkit.auth.domain.user.UserRepository;
import dev.goraebap.devkit.jooq.tables.records.UsersRecord;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

/** jOOQ에는 변경 감지가 없다 — 저장은 항상 명시적 {@code save} 호출이다 (설계/서버.md §5.3). */
@Repository
class JooqUserRepository implements UserRepository {

    private final DSLContext dsl;

    JooqUserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public void save(User user) {
        dsl.insertInto(USERS)
                .set(USERS.ID, user.id())
                .set(USERS.EMAIL, user.email().raw())
                .set(USERS.EMAIL_NORMALIZED, user.email().normalized())
                .set(USERS.EMAIL_VERIFIED_AT, offset(user.emailVerifiedAt()))
                .set(USERS.NICKNAME, user.nickname())
                .set(USERS.CREATED_AT, offset(user.createdAt()))
                .set(USERS.UPDATED_AT, offset(user.updatedAt()))
                .onConflict(USERS.ID)
                .doUpdate()
                .set(USERS.EMAIL, user.email().raw())
                .set(USERS.EMAIL_NORMALIZED, user.email().normalized())
                .set(USERS.NICKNAME, user.nickname())
                .set(USERS.UPDATED_AT, offset(user.updatedAt()))
                .execute();
    }

    @Override
    public boolean registerIfEmailAvailable(User user) {
        // on conflict do nothing: 유일성 경합이 예외가 아니라 "삽입 0건"으로 돌아와 트랜잭션이 살아 있다
        int inserted = dsl.insertInto(USERS)
                .set(USERS.ID, user.id())
                .set(USERS.EMAIL, user.email().raw())
                .set(USERS.EMAIL_NORMALIZED, user.email().normalized())
                .set(USERS.EMAIL_VERIFIED_AT, offset(user.emailVerifiedAt()))
                .set(USERS.NICKNAME, user.nickname())
                .set(USERS.CREATED_AT, offset(user.createdAt()))
                .set(USERS.UPDATED_AT, offset(user.updatedAt()))
                .onConflict(USERS.EMAIL_NORMALIZED)
                .doNothing()
                .execute();
        return inserted > 0;
    }

    @Override
    public Optional<User> findById(UUID id) {
        return dsl.selectFrom(USERS).where(USERS.ID.eq(id)).fetchOptional().map(JooqUserRepository::toDomain);
    }

    @Override
    public Optional<User> findByEmailNormalized(String emailNormalized) {
        return dsl.selectFrom(USERS)
                .where(USERS.EMAIL_NORMALIZED.eq(emailNormalized))
                .fetchOptional()
                .map(JooqUserRepository::toDomain);
    }

    @Override
    public boolean existsByEmailNormalized(String emailNormalized) {
        return dsl.fetchExists(dsl.selectFrom(USERS).where(USERS.EMAIL_NORMALIZED.eq(emailNormalized)));
    }

    private static User toDomain(UsersRecord record) {
        return User.restore(
                record.getId(),
                new EmailAddress(record.getEmail(), record.getEmailNormalized()),
                record.getEmailVerifiedAt().toInstant(),
                record.getNickname(),
                record.getCreatedAt().toInstant(),
                record.getUpdatedAt().toInstant());
    }

    private static OffsetDateTime offset(java.time.Instant instant) {
        return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
    }
}
