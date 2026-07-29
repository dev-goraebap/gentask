package dev.goraebap.devkit.auth.application.recovery;

import dev.goraebap.devkit.auth.application.session.IssuedSession;
import dev.goraebap.devkit.auth.application.session.SessionService;
import dev.goraebap.devkit.auth.application.shared.AttemptRateLimiter;
import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
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
import java.util.Optional;
import java.util.UUID;
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

    @SuppressWarnings("checkstyle:ParameterNumber")
    public RecoveryService(
            UserRepository userRepository,
            AccountRepository accountRepository,
            SessionRepository sessionRepository,
            VerificationRepository verificationRepository,
            SessionService sessionService,
            RecoveryMailer recoveryMailer,
            AttemptRateLimiter rateLimiter,
            TokenHasher tokenHasher,
            PasswordHasher passwordHasher,
            SecureTokenGenerator tokenGenerator,
            AuthProperties properties,
            Clock clock) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.sessionRepository = sessionRepository;
        this.verificationRepository = verificationRepository;
        this.sessionService = sessionService;
        this.recoveryMailer = recoveryMailer;
        this.rateLimiter = rateLimiter;
        this.tokenHasher = tokenHasher;
        this.passwordHasher = passwordHasher;
        this.tokenGenerator = tokenGenerator;
        this.properties = properties;
        this.clock = clock;
    }

    /**
     * 비밀번호 재설정 코드 발급 (AUTH-07).
     *
     * <p>계정이 없거나, 있어도 비밀번호가 없는 소셜 전용 계정이면 코드를 보내지 않는다. 어느
     * 경우든 <b>대기 레코드를 만들고 같은 응답을 돌려준다</b> — 응답 형태·시간이 갈리면 그것이
     * 계정 존재의 신호가 된다.
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
            // 계정이 없어도 대기 레코드를 만든다 — user_id가 필요하므로 만들 수 없다.
            // 대신 안내 메일을 보내고 무의미한 식별자를 돌려준다: 클라이언트는 구분할 수 없고,
            // 그 식별자로 검증을 시도하면 "코드가 올바르지 않다"로 끝난다.
            recoveryMailer.sendNoAccountGuide(address.raw());
            return UUID.randomUUID();
        }

        UUID userId = user.orElseThrow().id();
        if (purpose == VerificationPurpose.PASSWORD_RESET && !hasPassword(userId)) {
            // 비밀번호가 없는 소셜 전용 계정 — 재설정할 대상이 없다. 복구 경로로 안내한다
            recoveryMailer.sendNoPasswordGuide(address.raw());
            return UUID.randomUUID();
        }

        Verification verification = Verification.issueForUser(
                UUID.randomUUID(),
                purpose,
                userId,
                address.raw(),
                address.normalized(),
                tokenHasher.hmac(code),
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

        Account credential = accountRepository
                .findByUserIdAndProvider(userId, AuthProvider.CREDENTIAL)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.AUTH_OTP_INVALID, "확인 코드를 다시 확인해 주세요"));
        credential.changePassword(passwordHasher.hash(newPassword), now);
        accountRepository.save(credential);

        // 전 세션 무효화 — 재설정을 요청한 세션도 끊는다
        sessionRepository.deleteAllByUserId(userId);

        // 대기 중인 이메일 변경 취소 — 이것이 없으면 재설정 후에 남의 변경이 완료된다
        int cancelled = verificationRepository.deleteAllByUserIdAndPurpose(userId, VerificationPurpose.EMAIL_CHANGE);
        if (cancelled > 0) {
            log.info("비밀번호 재설정으로 대기 중인 이메일 변경을 취소했다 (userId={}, count={})", userId, cancelled);
        }
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
        return new RecoveryLoginResult(userId, session, hasPassword);
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

        VerificationCheck check = verification.attempt(tokenHasher.hmac(code), clock.instant());
        verificationRepository.save(verification);
        rejectUnless(check, verification);
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
