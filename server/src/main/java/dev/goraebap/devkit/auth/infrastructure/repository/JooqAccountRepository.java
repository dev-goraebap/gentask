package dev.goraebap.devkit.auth.infrastructure.repository;

import static dev.goraebap.devkit.jooq.Tables.ACCOUNTS;

import dev.goraebap.devkit.auth.domain.account.Account;
import dev.goraebap.devkit.auth.domain.account.AccountRepository;
import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import dev.goraebap.devkit.jooq.tables.records.AccountsRecord;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class JooqAccountRepository implements AccountRepository {

    private final DSLContext dsl;

    @Override
    public void save(Account account) {
        dsl.insertInto(ACCOUNTS)
                .set(ACCOUNTS.ID, account.id())
                .set(ACCOUNTS.USER_ID, account.userId())
                .set(ACCOUNTS.PROVIDER, account.provider().value())
                .set(ACCOUNTS.PROVIDER_ACCOUNT_ID, account.providerAccountId())
                .set(ACCOUNTS.PASSWORD_HASH, account.passwordHash())
                .set(ACCOUNTS.CREATED_AT, offset(account.createdAt()))
                .set(ACCOUNTS.UPDATED_AT, offset(account.updatedAt()))
                .onConflict(ACCOUNTS.ID)
                .doUpdate()
                .set(ACCOUNTS.PASSWORD_HASH, account.passwordHash())
                .set(ACCOUNTS.UPDATED_AT, offset(account.updatedAt()))
                .execute();
    }

    @Override
    public Optional<Account> findByUserIdAndProvider(UUID userId, AuthProvider provider) {
        return dsl.selectFrom(ACCOUNTS)
                .where(ACCOUNTS.USER_ID.eq(userId).and(ACCOUNTS.PROVIDER.eq(provider.value())))
                .fetchOptional()
                .map(JooqAccountRepository::toDomain);
    }

    @Override
    public Optional<Account> findByProviderAndProviderAccountId(AuthProvider provider, String providerAccountId) {
        return dsl.selectFrom(ACCOUNTS)
                .where(ACCOUNTS.PROVIDER.eq(provider.value()).and(ACCOUNTS.PROVIDER_ACCOUNT_ID.eq(providerAccountId)))
                .fetchOptional()
                .map(JooqAccountRepository::toDomain);
    }

    private static Account toDomain(AccountsRecord record) {
        return Account.restore(
                record.getId(),
                record.getUserId(),
                AuthProvider.fromValue(record.getProvider()),
                record.getProviderAccountId(),
                record.getPasswordHash(),
                record.getCreatedAt().toInstant(),
                record.getUpdatedAt().toInstant());
    }

    private static OffsetDateTime offset(Instant instant) {
        return instant == null ? null : OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
    }
}
