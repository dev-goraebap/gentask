package xyz.gentask.module.user.infrastructure;

import static xyz.gentask.jooq.Tables.USERS;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.UsersRecord;
import xyz.gentask.module.user.domain.Email;
import xyz.gentask.module.user.domain.user.Nickname;
import xyz.gentask.module.user.domain.user.Role;
import xyz.gentask.module.user.domain.user.User;
import xyz.gentask.module.user.domain.user.UserRepository;

@Repository
@RequiredArgsConstructor
class JooqUserRepository implements UserRepository {

    private final DSLContext dslContext;

    @Override
    public void save(User user) {
        dslContext
                .insertInto(USERS)
                .set(USERS.ID, user.id())
                .set(USERS.EMAIL, user.email().value())
                .set(USERS.EMAIL_NORMALIZED, user.email().normalized())
                .set(USERS.NICKNAME, user.nickname().value())
                .set(USERS.ROLE, user.role().name())
                .set(USERS.CREATED_AT, user.createdAt())
                .set(USERS.UPDATED_AT, user.updatedAt())
                .onConflict(USERS.ID)
                .doUpdate()
                .set(USERS.NICKNAME, user.nickname().value())
                .set(USERS.ROLE, user.role().name())
                .set(USERS.UPDATED_AT, user.updatedAt())
                .execute();
    }

    @Override
    public Optional<User> findById(UUID userId) {
        return dslContext
                .selectFrom(USERS)
                .where(USERS.ID.eq(userId))
                .fetchOptional()
                .map(JooqUserRepository::toDomain);
    }

    @Override
    public Optional<User> findByEmailNormalized(String emailNormalized) {
        return dslContext
                .selectFrom(USERS)
                .where(USERS.EMAIL_NORMALIZED.eq(emailNormalized))
                .fetchOptional()
                .map(JooqUserRepository::toDomain);
    }

    @Override
    public boolean existsByEmailNormalized(String emailNormalized) {
        return dslContext.fetchExists(USERS, USERS.EMAIL_NORMALIZED.eq(emailNormalized));
    }

    private static User toDomain(UsersRecord usersRecord) {
        return User.restore(
                usersRecord.getId(),
                new Email(usersRecord.getEmail()),
                new Nickname(usersRecord.getNickname()),
                Role.valueOf(usersRecord.getRole()),
                usersRecord.getCreatedAt(),
                usersRecord.getUpdatedAt());
    }
}
