package dev.goraebap.devkit.auth.application.registration;

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
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 이메일 가입 — OTP 발급과 가입 완료 (AUTH-01, 결정-0015).
 *
 * <p>흐름의 불변식:
 *
 * <ul>
 *   <li>코드 발급 단계에서 {@code user} 행을 만들지 않는다 — 대기 시도는 {@code verification}에만 있다
 *   <li>대기 시도는 이메일을 예약하지 않는다 — 같은 이메일의 대기 레코드가 여럿 공존한다
 *   <li>검증은 대기 레코드 <b>식별자</b>로 조회한다 — {@code (이메일, 코드)}로 찾지 않는다
 *   <li>OTP 통과 후 세션 토큰을 <b>새로</b> 발급한다 — 대기 단계의 무엇도 세션으로 승격되지 않는다
 * </ul>
 */
@Slf4j
@Service
public class RegistrationService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final VerificationRepository verificationRepository;
    private final SessionService sessionService;
    private final SignupMailer signupMailer;
    private final AttemptRateLimiter rateLimiter;
    private final TokenHasher tokenHasher;
    private final PasswordHasher passwordHasher;
    private final SecureTokenGenerator tokenGenerator;
    private final AuthProperties properties;
    private final Clock clock;

    public RegistrationService(
            UserRepository userRepository,
            AccountRepository accountRepository,
            VerificationRepository verificationRepository,
            SessionService sessionService,
            SignupMailer signupMailer,
            AttemptRateLimiter rateLimiter,
            TokenHasher tokenHasher,
            PasswordHasher passwordHasher,
            SecureTokenGenerator tokenGenerator,
            AuthProperties properties,
            Clock clock) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.verificationRepository = verificationRepository;
        this.sessionService = sessionService;
        this.signupMailer = signupMailer;
        this.rateLimiter = rateLimiter;
        this.tokenHasher = tokenHasher;
        this.passwordHasher = passwordHasher;
        this.tokenGenerator = tokenGenerator;
        this.properties = properties;
        this.clock = clock;
    }

    /**
     * OTP 발급. 응답은 계정 존재 여부와 무관하게 같은 형태다 — 기존 계정이면 코드 대신 안내
     * 메일이 가고, 대기 레코드는 어느 쪽이든 만들어져 응답 시간·형태가 갈리지 않는다. 재발송은
     * 이 API를 다시 호출하는 것이다 (MAIL-01).
     */
    @Transactional
    public UUID issueSignupVerification(String email, String clientIp) {
        EmailAddress address = EmailAddress.of(email);
        AuthProperties.Otp otp = properties.otp();

        // IP를 먼저 본다. 거부되면 이메일 카운터를 건드리지 않는다 —
        // 그러지 않으면 공격자가 자기 한도를 넘긴 뒤에도 남의 이메일 쿼터를 계속 갉아먹는다
        if (!rateLimiter.tryAcquire("otp:issue:ip:" + clientIp, otp.issueIpLimit(), otp.issueIpWindow())) {
            throw new BusinessException(AuthErrorCode.AUTH_OTP_RATE_LIMITED, "잠시 후 다시 시도해 주세요");
        }
        if (!rateLimiter.tryAcquire(
                "otp:issue:email:" + address.normalized(), otp.issueEmailLimit(), otp.issueEmailWindow())) {
            throw new BusinessException(AuthErrorCode.AUTH_OTP_RATE_LIMITED, "잠시 후 다시 시도해 주세요");
        }

        String code = tokenGenerator.otpCode();
        Verification verification = Verification.issueSignup(
                UUID.randomUUID(), address.raw(), address.normalized(), tokenHasher.hmac(code), clock.instant());
        verificationRepository.save(verification);

        // 발송은 mail 모듈이 커밋 이후로 미룬다 — 롤백되면 메일이 나가지 않는다 (결정-0016)
        if (userRepository.existsByEmailNormalized(address.normalized())) {
            signupMailer.sendExistingAccountGuide(address.raw());
        } else {
            signupMailer.sendOtp(address.raw(), code);
        }
        return verification.id();
    }

    /**
     * 가입 완료 — OTP 검증 통과 시에만 {@code user}가 생긴다.
     *
     * <p>{@code noRollbackFor}: 검증 실패로 예외를 던져도 시도 횟수 증가는 커밋되어야 한다.
     * 롤백되면 시도 제한이 무력화된다.
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public SignupResult completeSignup(UUID verificationId, String code, String rawPassword, ClientInfo client) {
        AuthProperties.Otp otp = properties.otp();
        // 시도 제한은 레코드 단위(5회)와 요청 빈도(IP) 두 겹이다 — 레코드를 갈아치우며 대입하는
        // 경로를 레코드 단위 카운터만으로는 막을 수 없다
        if (!rateLimiter.tryAcquire(
                "otp:confirm:ip:" + client.ipAddress(), otp.confirmIpLimit(), otp.confirmIpWindow())) {
            throw new BusinessException(AuthErrorCode.AUTH_OTP_RATE_LIMITED, "잠시 후 다시 시도해 주세요");
        }

        Verification verification = verificationRepository
                .findForAttempt(verificationId, VerificationPurpose.EMAIL_SIGNUP)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.AUTH_OTP_INVALID, "확인 코드를 다시 확인해 주세요"));

        Instant now = clock.instant();
        VerificationCheck check = verification.attempt(tokenHasher.hmac(code), now);
        verificationRepository.save(verification);
        rejectUnless(check, verification);

        EmailAddress address = new EmailAddress(verification.targetEmailRaw(), verification.targetEmail());
        User user = User.register(UUID.randomUUID(), address, now);
        if (!userRepository.registerIfEmailAvailable(user)) {
            // 대기 중 다른 시도가 먼저 계정을 얻었다 — 코드는 소진되며, 로그인으로 안내한다
            throw new BusinessException(AuthErrorCode.AUTH_EMAIL_ALREADY_USED, "이미 가입된 이메일입니다. 로그인해 주세요");
        }
        accountRepository.save(Account.credential(UUID.randomUUID(), user.id(), passwordHasher.hash(rawPassword), now));

        IssuedSession session = sessionService.issue(user.id(), client);
        return new SignupResult(user.id(), user.email().raw(), session);
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
