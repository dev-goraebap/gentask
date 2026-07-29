package dev.goraebap.devkit.auth.domain.verification;

import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * OTP 대기 레코드 애그리거트 (결정-0015).
 *
 * <p>파라미터는 결정-0015 §결정 3에서 고정됐다 — 만료 10분, 시도 5회 실패 시 폐기, 1회용.
 * 설정으로 두지 않는 이유는 이 값들이 보안 파라미터이기 때문이다. 완화하려면 결정기록을 먼저
 * 고쳐야 한다.
 *
 * <p>가입 대기 레코드는 아직 사용자가 아니다 — {@code userId}는 기존 사용자 대상 용도
 * (비밀번호 재설정 등)에만 채워진다.
 */
public final class Verification {

    /** 발급 후 10분 (결정-0015 §결정 3). */
    public static final Duration TTL = Duration.ofMinutes(10);

    /** 5회 실패 시 폐기 후 재발송 요구 (결정-0015 §결정 3). */
    public static final int MAX_ATTEMPTS = 5;

    private final UUID id;
    private final VerificationPurpose purpose;
    private final String targetEmail;
    private final String targetEmailRaw;
    private final String codeHash;
    private int attempts;
    private final Instant expiresAt;
    private Instant consumedAt;
    private final UUID userId;
    private final AuthProvider socialProvider;
    private final String socialProviderAccountId;
    private final Instant createdAt;

    private Verification(
            UUID id,
            VerificationPurpose purpose,
            String targetEmail,
            String targetEmailRaw,
            String codeHash,
            int attempts,
            Instant expiresAt,
            Instant consumedAt,
            UUID userId,
            AuthProvider socialProvider,
            String socialProviderAccountId,
            Instant createdAt) {
        this.id = Objects.requireNonNull(id);
        this.purpose = Objects.requireNonNull(purpose);
        this.targetEmail = Objects.requireNonNull(targetEmail);
        this.targetEmailRaw = Objects.requireNonNull(targetEmailRaw);
        this.codeHash = Objects.requireNonNull(codeHash);
        this.attempts = attempts;
        this.expiresAt = Objects.requireNonNull(expiresAt);
        this.consumedAt = consumedAt;
        this.userId = userId;
        this.socialProvider = socialProvider;
        this.socialProviderAccountId = socialProviderAccountId;
        this.createdAt = Objects.requireNonNull(createdAt);
    }

    /**
     * 가입 대기 레코드. 사용자 없이 존재한다 — 이메일을 예약하지 않는다 (결정-0015 §결정 4).
     *
     * <p>원문과 정규화된 값을 함께 든다 — 판정은 정규화된 값으로, 표시·발송은 원문으로 한다
     * (결정-0015 §결정 5).
     */
    public static Verification issueSignup(
            UUID id, String targetEmailRaw, String targetEmailNormalized, String codeHash, Instant now) {
        return new Verification(
                id,
                VerificationPurpose.EMAIL_SIGNUP,
                targetEmailNormalized,
                targetEmailRaw,
                codeHash,
                0,
                now.plus(TTL),
                null,
                null,
                null,
                null,
                now);
    }

    /**
     * 기존 사용자를 대상으로 하는 대기 레코드 — 비밀번호 재설정(AUTH-07), 계정 복구(AUTH-08).
     *
     * <p>가입과 달리 {@code userId}가 채워진다. 검증이 통과해도 <b>새 사용자를 만들지 않고</b>
     * 이미 있는 사용자에 대해 후속 처리(비밀번호 교체·세션 발급)를 한다.
     *
     * <p>{@code purpose}를 인자로 받는 이유는 두 용도가 흐름만 다를 뿐 레코드 형태가 같기
     * 때문이다. 다만 <b>조회는 언제나 용도로 필터되므로</b> 재설정용 코드가 복구에 통과하는 일은
     * 없다 (결정-0015 §결정 8).
     */
    public static Verification issueForUser(
            UUID id,
            VerificationPurpose purpose,
            UUID userId,
            String targetEmailRaw,
            String targetEmailNormalized,
            String codeHash,
            Instant now) {
        if (purpose == VerificationPurpose.EMAIL_SIGNUP) {
            throw new IllegalArgumentException("가입 대기 레코드는 사용자를 가질 수 없다 — issueSignup을 쓰라");
        }
        return new Verification(
                id,
                purpose,
                targetEmailNormalized,
                targetEmailRaw,
                codeHash,
                0,
                now.plus(TTL),
                null,
                Objects.requireNonNull(userId, "기존 사용자 대상 용도에는 userId가 있어야 한다"),
                null,
                null,
                now);
    }

    /** 저장소 전용 재구성. */
    public static Verification restore(
            UUID id,
            VerificationPurpose purpose,
            String targetEmail,
            String targetEmailRaw,
            String codeHash,
            int attempts,
            Instant expiresAt,
            Instant consumedAt,
            UUID userId,
            AuthProvider socialProvider,
            String socialProviderAccountId,
            Instant createdAt) {
        return new Verification(
                id,
                purpose,
                targetEmail,
                targetEmailRaw,
                codeHash,
                attempts,
                expiresAt,
                consumedAt,
                userId,
                socialProvider,
                socialProviderAccountId,
                createdAt);
    }

    /**
     * 코드 검증을 시도한다. 상태 전이(시도 횟수 증가·소진 기록)는 이 안에서 일어나며, 호출자는
     * 결과와 무관하게 <b>반드시 저장해야</b> 실패 횟수가 누적된다.
     */
    public VerificationCheck attempt(String candidateCodeHash, Instant now) {
        if (consumedAt != null) {
            return VerificationCheck.ALREADY_CONSUMED;
        }
        if (!now.isBefore(expiresAt)) {
            return VerificationCheck.EXPIRED;
        }
        if (attempts >= MAX_ATTEMPTS) {
            return VerificationCheck.ATTEMPTS_EXCEEDED;
        }
        if (!constantTimeEquals(codeHash, candidateCodeHash)) {
            attempts++;
            return attempts >= MAX_ATTEMPTS ? VerificationCheck.ATTEMPTS_EXCEEDED : VerificationCheck.CODE_MISMATCH;
        }
        this.consumedAt = now;
        return VerificationCheck.OK;
    }

    /** 다이제스트 비교조차 타이밍을 흘리지 않게 한다. 입력 길이는 HMAC hex로 고정이라 길이 비교는 안전하다. */
    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) {
            return false;
        }
        int diff = 0;
        for (int i = 0; i < a.length(); i++) {
            diff |= a.charAt(i) ^ b.charAt(i);
        }
        return diff == 0;
    }

    public UUID id() {
        return id;
    }

    public VerificationPurpose purpose() {
        return purpose;
    }

    /** 정규화된 값 — 동일성·유일성 판정의 기준. */
    public String targetEmail() {
        return targetEmail;
    }

    /** 사용자가 입력한 원문 — 표시·발송용. */
    public String targetEmailRaw() {
        return targetEmailRaw;
    }

    public String codeHash() {
        return codeHash;
    }

    public int attempts() {
        return attempts;
    }

    public Instant expiresAt() {
        return expiresAt;
    }

    public Instant consumedAt() {
        return consumedAt;
    }

    public UUID userId() {
        return userId;
    }

    public AuthProvider socialProvider() {
        return socialProvider;
    }

    public String socialProviderAccountId() {
        return socialProviderAccountId;
    }

    public Instant createdAt() {
        return createdAt;
    }
}
