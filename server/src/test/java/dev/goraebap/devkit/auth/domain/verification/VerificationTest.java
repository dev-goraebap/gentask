package dev.goraebap.devkit.auth.domain.verification;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class VerificationTest {

    private static final Instant NOW = Instant.parse("2026-07-28T09:00:00Z");

    private Verification signup(String codeHash) {
        return Verification.issueSignup(UUID.randomUUID(), "user@example.com", codeHash, NOW);
    }

    @Test
    @DisplayName("AUTH-06 올바른 코드는 1회만 통과한다 — 사용 즉시 폐기된다 (결정-0015)")
    void 올바른_코드는_한_번만_통과한다() {
        Verification verification = signup("hash-ok");

        assertThat(verification.attempt("hash-ok", NOW)).isEqualTo(VerificationCheck.OK);
        assertThat(verification.consumedAt()).isEqualTo(NOW);
        assertThat(verification.attempt("hash-ok", NOW)).isEqualTo(VerificationCheck.ALREADY_CONSUMED);
    }

    @Test
    @DisplayName("AUTH-06 발급 10분 후에는 만료된다 (결정-0015)")
    void 만료된_코드는_통과하지_못한다() {
        Verification verification = signup("hash-ok");
        Instant afterTtl = NOW.plus(Verification.TTL);

        assertThat(verification.attempt("hash-ok", afterTtl)).isEqualTo(VerificationCheck.EXPIRED);
        assertThat(verification.consumedAt()).isNull();
    }

    @Test
    @DisplayName("AUTH-06 틀린 코드는 시도 횟수를 누적한다")
    void 틀린_코드는_시도_횟수를_누적한다() {
        Verification verification = signup("hash-ok");

        assertThat(verification.attempt("hash-wrong", NOW)).isEqualTo(VerificationCheck.CODE_MISMATCH);
        assertThat(verification.attempts()).isEqualTo(1);
    }

    @Test
    @DisplayName("AUTH-06 5회 실패 시 코드가 폐기된다 — 이후에는 올바른 코드도 통과하지 못한다 (결정-0015)")
    void 오회_실패하면_폐기된다() {
        Verification verification = signup("hash-ok");

        for (int i = 0; i < Verification.MAX_ATTEMPTS - 1; i++) {
            assertThat(verification.attempt("hash-wrong", NOW)).isEqualTo(VerificationCheck.CODE_MISMATCH);
        }
        assertThat(verification.attempt("hash-wrong", NOW)).isEqualTo(VerificationCheck.ATTEMPTS_EXCEEDED);
        assertThat(verification.attempt("hash-ok", NOW)).isEqualTo(VerificationCheck.ATTEMPTS_EXCEEDED);
        assertThat(verification.consumedAt()).isNull();
    }

    @Test
    @DisplayName("AUTH-06 가입 대기 레코드에는 사용자가 없다 (결정-0015)")
    void 가입_대기_레코드에는_사용자가_없다() {
        Verification verification = signup("hash-ok");

        assertThat(verification.userId()).isNull();
        assertThat(verification.purpose()).isEqualTo(VerificationPurpose.EMAIL_SIGNUP);
        assertThat(verification.expiresAt()).isEqualTo(NOW.plus(Duration.ofMinutes(10)));
    }
}
