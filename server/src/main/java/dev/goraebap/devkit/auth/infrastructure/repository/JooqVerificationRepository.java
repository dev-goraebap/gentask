package dev.goraebap.devkit.auth.infrastructure.repository;

import static dev.goraebap.devkit.jooq.Tables.VERIFICATIONS;

import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import dev.goraebap.devkit.auth.domain.verification.Verification;
import dev.goraebap.devkit.auth.domain.verification.VerificationPurpose;
import dev.goraebap.devkit.auth.domain.verification.VerificationRepository;
import dev.goraebap.devkit.jooq.tables.records.VerificationsRecord;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
class JooqVerificationRepository implements VerificationRepository {

    private final DSLContext dsl;

    JooqVerificationRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    @Override
    public void save(Verification verification) {
        dsl.insertInto(VERIFICATIONS)
                .set(VERIFICATIONS.ID, verification.id())
                .set(VERIFICATIONS.PURPOSE, verification.purpose().name())
                .set(VERIFICATIONS.TARGET_EMAIL, verification.targetEmail())
                .set(VERIFICATIONS.CODE_HASH, verification.codeHash())
                .set(VERIFICATIONS.ATTEMPTS, verification.attempts())
                .set(VERIFICATIONS.EXPIRES_AT, offset(verification.expiresAt()))
                .set(VERIFICATIONS.CONSUMED_AT, offset(verification.consumedAt()))
                .set(VERIFICATIONS.USER_ID, verification.userId())
                .set(
                        VERIFICATIONS.SOCIAL_PROVIDER,
                        verification.socialProvider() == null
                                ? null
                                : verification.socialProvider().value())
                .set(VERIFICATIONS.SOCIAL_PROVIDER_ACCOUNT_ID, verification.socialProviderAccountId())
                .set(VERIFICATIONS.CREATED_AT, offset(verification.createdAt()))
                .onConflict(VERIFICATIONS.ID)
                .doUpdate()
                .set(VERIFICATIONS.ATTEMPTS, verification.attempts())
                .set(VERIFICATIONS.CONSUMED_AT, offset(verification.consumedAt()))
                .execute();
    }

    @Override
    public Optional<Verification> findByIdAndPurpose(UUID id, VerificationPurpose purpose) {
        return dsl.selectFrom(VERIFICATIONS)
                .where(VERIFICATIONS.ID.eq(id).and(VERIFICATIONS.PURPOSE.eq(purpose.name())))
                .fetchOptional()
                .map(JooqVerificationRepository::toDomain);
    }

    private static Verification toDomain(VerificationsRecord record) {
        return Verification.restore(
                record.getId(),
                VerificationPurpose.valueOf(record.getPurpose()),
                record.getTargetEmail(),
                record.getCodeHash(),
                record.getAttempts(),
                record.getExpiresAt().toInstant(),
                instant(record.getConsumedAt()),
                record.getUserId(),
                record.getSocialProvider() == null ? null : AuthProvider.fromValue(record.getSocialProvider()),
                record.getSocialProviderAccountId(),
                record.getCreatedAt().toInstant());
    }

    private static OffsetDateTime offset(Instant instant) {
        return instant == null ? null : OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
    }

    private static Instant instant(OffsetDateTime value) {
        return value == null ? null : value.toInstant();
    }
}
