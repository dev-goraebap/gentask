package xyz.gentask.module.user.infrastructure;

import static xyz.gentask.jooq.Tables.ACCOUNTS;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.AccountsRecord;
import xyz.gentask.module.user.domain.account.Account;
import xyz.gentask.module.user.domain.account.AccountRepository;

@Repository
@RequiredArgsConstructor
class JooqAccountRepository implements AccountRepository {

    private final DSLContext dslContext;

    @Override
    public void save(Account account) {
        dslContext
                .insertInto(ACCOUNTS)
                .set(ACCOUNTS.ID, account.id())
                .set(ACCOUNTS.USER_ID, account.userId())
                .set(ACCOUNTS.PROVIDER, account.provider())
                .set(ACCOUNTS.PROVIDER_ACCOUNT_ID, account.providerAccountId())
                .set(ACCOUNTS.PASSWORD_HASH, account.passwordHash())
                .set(ACCOUNTS.CREATED_AT, account.createdAt())
                .set(ACCOUNTS.UPDATED_AT, account.updatedAt())
                .onConflict(ACCOUNTS.ID)
                .doUpdate()
                .set(ACCOUNTS.PASSWORD_HASH, account.passwordHash())
                .set(ACCOUNTS.UPDATED_AT, account.updatedAt())
                .execute();
    }

    @Override
    public Optional<Account> findCredential(String emailNormalized) {
        return dslContext
                .selectFrom(ACCOUNTS)
                .where(ACCOUNTS.PROVIDER.eq(Account.CREDENTIAL))
                .and(ACCOUNTS.PROVIDER_ACCOUNT_ID.eq(emailNormalized))
                .fetchOptional()
                .map(JooqAccountRepository::toDomain);
    }

    @Override
    public Optional<Account> findCredentialByUserId(UUID userId) {
        return dslContext
                .selectFrom(ACCOUNTS)
                .where(ACCOUNTS.PROVIDER.eq(Account.CREDENTIAL))
                .and(ACCOUNTS.USER_ID.eq(userId))
                .fetchOptional()
                .map(JooqAccountRepository::toDomain);
    }

    private static Account toDomain(AccountsRecord accountsRecord) {
        return Account.restore(
                accountsRecord.getId(),
                accountsRecord.getUserId(),
                accountsRecord.getProvider(),
                accountsRecord.getProviderAccountId(),
                accountsRecord.getPasswordHash(),
                accountsRecord.getCreatedAt(),
                accountsRecord.getUpdatedAt());
    }
}
