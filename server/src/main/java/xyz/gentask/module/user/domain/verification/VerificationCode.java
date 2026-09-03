package xyz.gentask.module.user.domain.verification;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;
import xyz.gentask.module.user.domain.Email;

/**
 * 이메일 인증용 일회용 코드 엔터티다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class VerificationCode {

    @NonNull private final UUID id;

    @NonNull private final VerificationPurpose purpose;

    @NonNull private final String emailNormalized;

    @NonNull private final String codeHash;

    private final String signupPasswordHash;

    private final String signupNickname;

    private int attempts;

    @NonNull private final Instant expiresAt;

    @NonNull private final Instant createdAt;

    public static VerificationCode forSignup(
            UUID id, Email email, String codeHash, String passwordHash, String nickname, Instant now, Duration ttl) {
        return new VerificationCode(
                id,
                VerificationPurpose.SIGNUP,
                email.normalized(),
                codeHash,
                passwordHash,
                nickname,
                0,
                now.plus(ttl),
                now);
    }

    public static VerificationCode forPasswordReset(UUID id, Email email, String codeHash, Instant now, Duration ttl) {
        return new VerificationCode(
                id,
                VerificationPurpose.PASSWORD_RESET,
                email.normalized(),
                codeHash,
                null,
                null,
                0,
                now.plus(ttl),
                now);
    }

    public static VerificationCode restore(
            UUID id,
            VerificationPurpose purpose,
            String emailNormalized,
            String codeHash,
            String signupPasswordHash,
            String signupNickname,
            int attempts,
            Instant expiresAt,
            Instant createdAt) {
        return new VerificationCode(
                id,
                purpose,
                emailNormalized,
                codeHash,
                signupPasswordHash,
                signupNickname,
                attempts,
                expiresAt,
                createdAt);
    }

    public boolean isExpired(Instant now) {
        return !now.isBefore(expiresAt);
    }

    public boolean matches(String candidateHash) {
        return codeHash.equals(candidateHash);
    }

    /**
     * 인증 실패 횟수를 1 증가시키고 최대 허용 횟수 도달 여부를 반환한다.
     */
    public boolean recordFailure(int maxAttempts) {
        attempts++;
        return attempts >= maxAttempts;
    }
}
