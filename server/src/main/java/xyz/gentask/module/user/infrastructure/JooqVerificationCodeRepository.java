package xyz.gentask.module.user.infrastructure;

import static xyz.gentask.jooq.Tables.VERIFICATION_CODES;

import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.gentask.jooq.tables.records.VerificationCodesRecord;
import xyz.gentask.module.user.domain.verification.VerificationCode;
import xyz.gentask.module.user.domain.verification.VerificationCodeRepository;
import xyz.gentask.module.user.domain.verification.VerificationPurpose;

@Repository
@RequiredArgsConstructor
class JooqVerificationCodeRepository implements VerificationCodeRepository {

    private final DSLContext dslContext;

    /**
     * (이메일, 자리)가 유일하므로 다시 요청하는 것이 곧 그 행을 갈아 끼우는 것이다. 새 행을 더하지
     * 않으므로 한 주소가 만드는 행이 자리마다 하나로 묶인다.
     */
    @Override
    public void save(VerificationCode code) {
        dslContext
                .insertInto(VERIFICATION_CODES)
                .set(VERIFICATION_CODES.ID, code.id())
                .set(VERIFICATION_CODES.PURPOSE, code.purpose().name())
                .set(VERIFICATION_CODES.EMAIL_NORMALIZED, code.emailNormalized())
                .set(VERIFICATION_CODES.CODE_HASH, code.codeHash())
                .set(VERIFICATION_CODES.SIGNUP_PASSWORD_HASH, code.signupPasswordHash())
                .set(VERIFICATION_CODES.SIGNUP_NICKNAME, code.signupNickname())
                .set(VERIFICATION_CODES.ATTEMPTS, code.attempts())
                .set(VERIFICATION_CODES.EXPIRES_AT, code.expiresAt())
                .set(VERIFICATION_CODES.CREATED_AT, code.createdAt())
                .onConflict(VERIFICATION_CODES.EMAIL_NORMALIZED, VERIFICATION_CODES.PURPOSE)
                .doUpdate()
                .set(VERIFICATION_CODES.ID, code.id())
                .set(VERIFICATION_CODES.CODE_HASH, code.codeHash())
                .set(VERIFICATION_CODES.SIGNUP_PASSWORD_HASH, code.signupPasswordHash())
                .set(VERIFICATION_CODES.SIGNUP_NICKNAME, code.signupNickname())
                .set(VERIFICATION_CODES.ATTEMPTS, code.attempts())
                .set(VERIFICATION_CODES.EXPIRES_AT, code.expiresAt())
                .set(VERIFICATION_CODES.CREATED_AT, code.createdAt())
                .execute();
    }

    @Override
    public Optional<VerificationCode> find(String emailNormalized, VerificationPurpose purpose) {
        return dslContext
                .selectFrom(VERIFICATION_CODES)
                .where(VERIFICATION_CODES.EMAIL_NORMALIZED.eq(emailNormalized))
                .and(VERIFICATION_CODES.PURPOSE.eq(purpose.name()))
                .fetchOptional()
                .map(JooqVerificationCodeRepository::toDomain);
    }

    @Override
    public void delete(String emailNormalized, VerificationPurpose purpose) {
        dslContext
                .deleteFrom(VERIFICATION_CODES)
                .where(VERIFICATION_CODES.EMAIL_NORMALIZED.eq(emailNormalized))
                .and(VERIFICATION_CODES.PURPOSE.eq(purpose.name()))
                .execute();
    }

    private static VerificationCode toDomain(VerificationCodesRecord record) {
        return VerificationCode.restore(
                record.getId(),
                VerificationPurpose.valueOf(record.getPurpose()),
                record.getEmailNormalized(),
                record.getCodeHash(),
                record.getSignupPasswordHash(),
                record.getSignupNickname(),
                record.getAttempts(),
                record.getExpiresAt(),
                record.getCreatedAt());
    }
}
