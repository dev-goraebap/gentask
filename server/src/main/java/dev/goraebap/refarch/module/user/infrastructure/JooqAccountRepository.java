package dev.goraebap.refarch.module.user.infrastructure;

import static dev.goraebap.refarch.jooq.Tables.ACCOUNTS;

import dev.goraebap.refarch.jooq.tables.records.AccountsRecord;
import dev.goraebap.refarch.module.user.domain.Account;
import dev.goraebap.refarch.module.user.domain.AccountRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

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
