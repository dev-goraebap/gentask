package dev.goraebap.refarch.module.user.infrastructure;

import static dev.goraebap.refarch.jooq.Tables.USERS;

import dev.goraebap.refarch.jooq.tables.records.UsersRecord;
import dev.goraebap.refarch.module.user.domain.Email;
import dev.goraebap.refarch.module.user.domain.user.Nickname;
import dev.goraebap.refarch.module.user.domain.user.User;
import dev.goraebap.refarch.module.user.domain.user.UserRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

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
                .set(USERS.PROFILE_IMAGE_KEY, user.profileImageKey())
                .set(USERS.CREATED_AT, user.createdAt())
                .set(USERS.UPDATED_AT, user.updatedAt())
                .onConflict(USERS.ID)
                .doUpdate()
                .set(USERS.NICKNAME, user.nickname().value())
                .set(USERS.PROFILE_IMAGE_KEY, user.profileImageKey())
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
    public boolean existsByEmailNormalized(String emailNormalized) {
        return dslContext.fetchExists(USERS, USERS.EMAIL_NORMALIZED.eq(emailNormalized));
    }

    private static User toDomain(UsersRecord usersRecord) {
        return User.restore(
                usersRecord.getId(),
                new Email(usersRecord.getEmail()),
                new Nickname(usersRecord.getNickname()),
                usersRecord.getProfileImageKey(),
                usersRecord.getCreatedAt(),
                usersRecord.getUpdatedAt());
    }
}
