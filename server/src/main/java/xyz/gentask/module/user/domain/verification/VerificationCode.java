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
 * 이메일 주소로 보낸 일회용 코드.
 *
 * <p>가입은 계정이 아직 없어 계정의 재료(비밀번호 해시 · 별명)를 이 행이 함께 든다. 재설정은 이미
 * 있는 계정을 이메일로 지목하므로 그 자리가 비어 있다.
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class VerificationCode {

    // 식별자
    @NonNull private final UUID id;

    // 쓰이는 자리
    @NonNull private final VerificationPurpose purpose;

    // 보낸 주소의 정규화 값
    @NonNull private final String emailNormalized;

    // 코드의 HMAC-SHA256 hex
    @NonNull private final String codeHash;

    // 가입에서만 값을 갖는다
    private final String signupPasswordHash;

    private final String signupNickname;

    // 틀린 횟수
    private int attempts;

    // 만료 시각
    @NonNull private final Instant expiresAt;

    // 만든 시각
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
     * 틀린 횟수를 하나 올리고, 한도를 채웠는지 낸다.
     *
     * <p>한도를 채운 코드는 거둔다. 거둔 뒤에는 만료된 것과 같은 응답을 내므로, 몇 번 남았는지가
     * 밖으로 드러나지 않는다.
     */
    public boolean recordFailure(int maxAttempts) {
        attempts++;
        return attempts >= maxAttempts;
    }
}
