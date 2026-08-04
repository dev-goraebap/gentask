package dev.goraebap.devkit.auth.application.recovery;

import dev.goraebap.devkit.auth.application.session.IssuedSession;
import dev.goraebap.devkit.auth.application.session.SessionService;
import dev.goraebap.devkit.auth.application.shared.AttemptRateLimiter;
import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
import dev.goraebap.devkit.auth.application.shared.HmacPurpose;
import dev.goraebap.devkit.auth.application.shared.PasswordHasher;
import dev.goraebap.devkit.auth.application.shared.SecureTokenGenerator;
import dev.goraebap.devkit.auth.application.shared.TokenHasher;
import dev.goraebap.devkit.auth.domain.account.Account;
import dev.goraebap.devkit.auth.domain.account.AccountRepository;
import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import dev.goraebap.devkit.auth.domain.session.SessionRepository;
import dev.goraebap.devkit.auth.domain.user.EmailAddress;
import dev.goraebap.devkit.auth.domain.user.User;
import dev.goraebap.devkit.auth.domain.user.UserRepository;
import dev.goraebap.devkit.auth.domain.verification.Verification;
import dev.goraebap.devkit.auth.domain.verification.VerificationCheck;
import dev.goraebap.devkit.auth.domain.verification.VerificationPurpose;
import dev.goraebap.devkit.auth.domain.verification.VerificationRepository;
import dev.goraebap.devkit.common.BusinessException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 로그인할 수 없는 상태의 복구 (AUTH-07 비밀번호 재설정, AUTH-08 이메일 복구).
 *
 * <p>두 흐름의 구조는 같다 — 이메일로 코드를 받고, 통과하면 계정에 대한 접근을 회복한다.
 * 다른 것은 <b>회복의 내용</b>뿐이다: 재설정은 비밀번호를 바꾸고, 복구는 세션만 발급한다.
 *
 * <p>흐름의 불변식:
 *
 * <ul>
 *   <li>발급 응답은 계정 존재 여부와 무관하게 같다 — 실제 분기는 메일 내용으로 가른다
 *   <li>용도가 다른 코드는 통하지 않는다 — 조회가 항상 {@code purpose}로 필터된다
 *   <li>재설정 성공 시 <b>모든 세션이 사라진다</b> — 요청한 세션도 예외가 아니다
 *   <li>재설정 성공 시 <b>대기 중인 이메일 변경이 취소된다</b>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecoveryService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final SessionRepository sessionRepository;
    private final VerificationRepository verificationRepository;
    private final SessionService sessionService;
    private final RecoveryMailer recoveryMailer;
    private final AttemptRateLimiter rateLimiter;
    private final TokenHasher tokenHasher;
    private final PasswordHasher passwordHasher;
    private final SecureTokenGenerator tokenGenerator;
    private final AuthProperties properties;
    private final Clock clock;

    /**
     * 비밀번호 재설정 코드 발급 (AUTH-07).
     *
     * <p>계정이 없거나, 있어도 비밀번호가 없는 소셜 전용 계정이면 코드를 보내지 않는다. 어느
     * 경우든 <b>대기 레코드를 만들고 같은 응답을 돌려준다</b> — 응답 형태·시간이 갈리면 그것이
     * 계정 존재의 신호가 된다. 코드를 보내지 않는 경우에는 아무도 맞힐 수 없는 미끼 레코드를
     * 남겨, 시도 횟수를 소진시켜 보는 방법으로도 두 경우를 구분할 수 없게 한다.
     */
    @Transactional
    public UUID issuePasswordReset(String email, String clientIp) {
        return issueForExistingUser(email, clientIp, VerificationPurpose.PASSWORD_RESET);
    }

    /** 계정 복구 코드 발급 (AUTH-08). */
    @Transactional
    public UUID issueAccountRecovery(String email, String clientIp) {
        return issueForExistingUser(email, clientIp, VerificationPurpose.ACCOUNT_RECOVERY);
    }

    private UUID issueForExistingUser(String email, String clientIp, VerificationPurpose purpose) {
        EmailAddress address = EmailAddress.of(email);
        AuthProperties.Otp otp = properties.otp();

        if (!rateLimiter.tryAcquire("otp:issue:ip:" + clientIp, otp.issueIpLimit(), otp.issueIpWindow())) {
            throw new BusinessException(AuthErrorCode.AUTH_OTP_RATE_LIMITED, "잠시 후 다시 시도해 주세요");
        }
        if (!rateLimiter.tryAcquire(
                "otp:issue:email:" + address.normalized(), otp.issueEmailLimit(), otp.issueEmailWindow())) {
            throw new BusinessException(AuthErrorCode.AUTH_OTP_RATE_LIMITED, "잠시 후 다시 시도해 주세요");
        }

        Optional<User> user = userRepository.findByEmailNormalized(address.normalized());
        String code = tokenGenerator.otpCode();

        if (user.isEmpty()) {
            recoveryMailer.sendNoAccountGuide(address.raw());
            return saveDecoy(address, purpose);
        }

        UUID userId = user.orElseThrow().id();
        if (purpose == VerificationPurpose.PASSWORD_RESET && !hasPassword(userId)) {
            // 비밀번호가 없는 소셜 전용 계정 — 재설정할 대상이 없다. 복구 경로로 안내한다
            recoveryMailer.sendNoPasswordGuide(address.raw());
            return saveDecoy(address, purpose);
        }

        Verification verification = Verification.issueForUser(
                UUID.randomUUID(),
                purpose,
                userId,
                address.raw(),
                address.normalized(),
                tokenHasher.hmac(HmacPurpose.OTP, code),
                clock.instant());
        verificationRepository.save(verification);

        if (purpose == VerificationPurpose.PASSWORD_RESET) {
            recoveryMailer.sendPasswordResetOtp(address.raw(), code);
        } else {
            recoveryMailer.sendAccountRecoveryOtp(address.raw(), code);
        }
        return verification.id();
    }

    /**
     * 비밀번호 재설정 완료 (AUTH-07).
     *
     * <p>성공 시 그 사용자의 <b>모든 세션이 사라진다</b>. 재설정을 요청한 세션도 포함된다 —
     * 비밀번호를 바꾸는 시점에 계정에 붙어 있던 접근을 전부 끊는 것이 목적이기 때문이다.
     * 사용자는 새 비밀번호로 다시 로그인한다.
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public void completePasswordReset(UUID verificationId, String code, String newPassword, String clientIp) {
        Verification verification = consume(verificationId, code, VerificationPurpose.PASSWORD_RESET, clientIp);
        UUID userId = verification.userId();
        Instant now = clock.instant();

        // 잠그고 읽는다 — 이 트랜잭션이 도는 동안 같은 계정으로 로그인이 통과해
        // 아래 세션 삭제를 피해 가는 경합을 막는다 (검토 #32-1)
        Account credential = accountRepository
                .findByUserIdAndProviderForUpdate(userId, AuthProvider.CREDENTIAL)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.AUTH_OTP_INVALID, "확인 코드를 다시 확인해 주세요"));
        credential.changePassword(passwordHasher.hash(newPassword), now);
        accountRepository.save(credential);

        // 전 세션 무효화 — 재설정을 요청한 세션도 끊는다
        sessionRepository.deleteAllByUserId(userId);

        // 대기 중인 코드를 전부 취소한다. 세션만 끊는 것으로는 부족하다 —
        // 살아 있는 복구 코드가 남아 있으면, 메일함을 잠깐 봤던 공격자가 재설정 직후에 그 코드로
        // 비밀번호 없이 다시 들어올 수 있다. 이메일 변경도 같은 이유로 지운다(pre-hijacking 변종 4).
        int cancelled = 0;
        for (VerificationPurpose stale : List.of(
                VerificationPurpose.EMAIL_CHANGE,
                VerificationPurpose.ACCOUNT_RECOVERY,
                VerificationPurpose.PASSWORD_RESET)) {
            cancelled += verificationRepository.deleteAllByUserIdAndPurpose(userId, stale);
        }
        if (cancelled > 0) {
            log.info("비밀번호 재설정으로 대기 중인 코드를 취소했다 (userId={}, count={})", userId, cancelled);
        }

        // 공격자가 오답으로 채워둔 카운터 때문에 정작 주인이 새 비밀번호로 못 들어가는 일을 막는다
        rateLimiter.reset("login:account:" + verification.targetEmail());
    }

    /**
     * 계정 복구 로그인 (AUTH-08). 비밀번호를 요구하지 않고 세션을 <b>새로</b> 발급한다.
     *
     * <p>이 경로가 존재하는 순간 이메일 메일함이 계정의 최상위 신뢰 근원이 된다(결정-0015).
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public RecoveryLoginResult completeAccountRecovery(UUID verificationId, String code, ClientInfo client) {
        Verification verification =
                consume(verificationId, code, VerificationPurpose.ACCOUNT_RECOVERY, client.ipAddress());
        UUID userId = verification.userId();

        IssuedSession session = sessionService.issue(userId, client);
        boolean hasPassword = hasPassword(userId);

        // 복구 로그인은 비밀번호 없이 세션을 준다 — 본인이 아니라면 알아차릴 수 있어야 한다.
        // 기존 세션을 끊지 않으므로 이 알림이 유일한 신호다.
        recoveryMailer.sendRecoveryLoginNotice(verification.targetEmailRaw());
        return new RecoveryLoginResult(userId, session, hasPassword);
    }

    /**
     * 미끼 대기 레코드를 남긴다 — 코드를 보내지 않은 경우에도 진짜와 같은 흔적을 만든다.
     *
     * <p>코드 해시에 버려지는 난수의 다이제스트를 넣으므로 아무도 통과할 수 없고, 시도 횟수는
     * 진짜와 똑같이 쌓여 5회에 소진된다. 응답도, 시도 소진 경로도 구분되지 않는다.
     */
    private UUID saveDecoy(EmailAddress address, VerificationPurpose purpose) {
        Verification decoy = Verification.issueDecoy(
                UUID.randomUUID(),
                purpose,
                address.raw(),
                address.normalized(),
                tokenHasher.hmac(HmacPurpose.SESSION, tokenGenerator.sessionToken()),
                clock.instant());
        verificationRepository.save(decoy);
        return decoy.id();
    }

    /** 코드 검증과 소진. 세 흐름이 공유하는 부분이다. */
    private Verification consume(UUID verificationId, String code, VerificationPurpose purpose, String clientIp) {
        AuthProperties.Otp otp = properties.otp();
        if (!rateLimiter.tryAcquire("otp:confirm:ip:" + clientIp, otp.confirmIpLimit(), otp.confirmIpWindow())) {
            throw new BusinessException(AuthErrorCode.AUTH_OTP_RATE_LIMITED, "잠시 후 다시 시도해 주세요");
        }

        Verification verification = verificationRepository
                .findForAttempt(verificationId, purpose)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.AUTH_OTP_INVALID, "확인 코드를 다시 확인해 주세요"));

        VerificationCheck check = verification.attempt(tokenHasher.hmac(HmacPurpose.OTP, code), clock.instant());
        verificationRepository.save(verification);
        rejectUnless(check, verification);

        if (verification.isDecoy()) {
            // 도달할 수 없는 경로다 — 미끼의 코드 해시는 아무도 모르는 난수라 attempt가 통과하지
            // 못한다. 그래도 확인한다: 이 방어가 뚫리면 사용자 없이 후속 처리가 도는 셈이다
            log.error("미끼 레코드가 검증을 통과했다 — 코드 해시 생성을 점검하라 (verificationId={})", verification.id());
            throw new BusinessException(AuthErrorCode.AUTH_OTP_INVALID, "확인 코드를 다시 확인해 주세요");
        }
        return verification;
    }

    private boolean hasPassword(UUID userId) {
        return accountRepository
                .findByUserIdAndProvider(userId, AuthProvider.CREDENTIAL)
                .isPresent();
    }

    private void rejectUnless(VerificationCheck check, Verification verification) {
        switch (check) {
            case OK -> {}
            case EXPIRED -> throw new BusinessException(AuthErrorCode.AUTH_OTP_EXPIRED, "확인 코드가 만료되었습니다. 다시 요청해 주세요");
            case ATTEMPTS_EXCEEDED ->
                throw new BusinessException(AuthErrorCode.AUTH_OTP_ATTEMPTS_EXCEEDED, "시도 횟수를 초과했습니다. 코드를 다시 요청해 주세요");
            case ALREADY_CONSUMED -> {
                log.warn("소진된 대기 레코드 재사용 시도 (verificationId={})", verification.id());
                throw new BusinessException(AuthErrorCode.AUTH_OTP_INVALID, "확인 코드를 다시 확인해 주세요");
            }
            case CODE_MISMATCH -> throw new BusinessException(AuthErrorCode.AUTH_OTP_INVALID, "확인 코드를 다시 확인해 주세요");
            default -> throw new IllegalStateException("처리되지 않은 검증 결과: " + check);
        }
    }
}
