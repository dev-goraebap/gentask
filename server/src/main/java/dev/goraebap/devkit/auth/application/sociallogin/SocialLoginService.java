package dev.goraebap.devkit.auth.application.sociallogin;

import dev.goraebap.devkit.auth.application.registration.SignupMailer;
import dev.goraebap.devkit.auth.application.session.IssuedSession;
import dev.goraebap.devkit.auth.application.session.SessionService;
import dev.goraebap.devkit.auth.application.shared.AttemptRateLimiter;
import dev.goraebap.devkit.auth.application.shared.AuthErrorCode;
import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import dev.goraebap.devkit.auth.application.shared.ClientInfo;
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
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 소셜 로그인 (AUTH-02·03) 과 이메일 키 통합 (AUTH-05).
 *
 * <p>최초 로그인이 2단계인 이유는 <b>제공자가 이메일을 증명해주지 않기 때문</b>이다(결정-0015).
 * 제공자는 "이 사람이 그 계정 주인이다"만 말해주고, "이 이메일이 이 사람 것이다"는 우리가 OTP로
 * 확인한다.
 *
 * <pre>
 * 1단계  제공자 인증 → 이미 아는 신원인가?
 *         예 → 바로 로그인
 *         아니오 → 중간 표를 주고 이메일을 묻는다
 * 2단계  이메일 입력 → 그 이메일의 계정이 이미 있는가?
 *         예 → OTP를 보내지 않고 "로그인 후 연동"으로 안내한다  ← AUTH-05의 핵심
 *         아니오 → OTP 발송 → 통과하면 user + 소셜 account 생성
 * </pre>
 *
 * <p><b>기존 계정에 OTP를 보내지 않는 것</b>이 이 흐름의 방어선이다. 보내면 공격자가 피해자
 * 이메일로 소셜 계정을 만들어 놓고 그 코드를 가로채려 시도할 여지가 생긴다. 대신 기존 인증
 * 수단으로 로그인하게 해서 <b>지금 그 계정에 접근할 수 있음</b>을 증명시킨다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SocialLoginService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final VerificationRepository verificationRepository;
    private final SessionService sessionService;
    private final SignupMailer signupMailer;
    private final AttemptRateLimiter rateLimiter;
    private final PendingSocialTicketCodec ticketCodec;
    private final TokenHasher tokenHasher;
    private final SecureTokenGenerator tokenGenerator;
    private final AuthProperties properties;
    private final Clock clock;

    /**
     * 1단계 — 제공자 인증 결과를 받는다.
     *
     * <p>이미 이 제공자 신원으로 만든 계정이 있으면 바로 로그인시킨다. 처음 보는 신원이면
     * 이메일을 물어야 하므로 중간 표를 발급한다 — 이 단계에서는 <b>아무것도 저장하지 않는다.</b>
     */
    @Transactional
    public SocialLoginOutcome onProviderAuthenticated(SocialIdentity identity, ClientInfo client) {
        Optional<Account> existing =
                accountRepository.findByProviderAndProviderAccountId(identity.provider(), identity.providerAccountId());

        if (existing.isPresent()) {
            IssuedSession session = sessionService.issue(existing.orElseThrow().userId(), client);
            return SocialLoginOutcome.signedIn(existing.orElseThrow().userId(), session);
        }
        return SocialLoginOutcome.emailRequired();
    }

    /** 1단계의 중간 표를 만든다. 컨트롤러가 리다이렉트 파라미터로 실어 보낸다. */
    public String issueTicket(SocialIdentity identity) {
        return ticketCodec.encode(identity.provider(), identity.providerAccountId());
    }

    /**
     * 2단계 앞부분 — 이메일을 받아 OTP를 보낸다.
     *
     * <p>그 이메일에 이미 계정이 있으면 <b>코드를 보내지 않고</b> 안내 메일만 보낸다(AUTH-05).
     * 응답은 두 경우가 같다 — 화면이 계정 존재를 단정하지 않기 위해서다.
     */
    @Transactional
    public UUID requestEmailVerification(String ticket, String email, String clientIp) {
        PendingSocialTicket pending = ticketCodec
                .decode(ticket)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.AUTH_SOCIAL_TICKET_INVALID, "다시 로그인해 주세요"));

        EmailAddress address = EmailAddress.of(email);
        AuthProperties.Otp otp = properties.otp();
        if (!rateLimiter.tryAcquire("otp:issue:ip:" + clientIp, otp.issueIpLimit(), otp.issueIpWindow())) {
            throw new BusinessException(AuthErrorCode.AUTH_OTP_RATE_LIMITED, "잠시 후 다시 시도해 주세요");
        }
        if (!rateLimiter.tryAcquire(
                "otp:issue:email:" + address.normalized(), otp.issueEmailLimit(), otp.issueEmailWindow())) {
            throw new BusinessException(AuthErrorCode.AUTH_OTP_RATE_LIMITED, "잠시 후 다시 시도해 주세요");
        }

        // 그 사이에 같은 제공자 신원으로 계정이 생겼을 수 있다 — 마지막으로 한 번 더 본다
        if (accountRepository
                .findByProviderAndProviderAccountId(pending.provider(), pending.providerAccountId())
                .isPresent()) {
            throw new BusinessException(AuthErrorCode.AUTH_SOCIAL_TICKET_INVALID, "다시 로그인해 주세요");
        }

        String code = tokenGenerator.otpCode();
        Verification verification = Verification.issueSocialSignup(
                UUID.randomUUID(),
                pending.provider(),
                pending.providerAccountId(),
                address.raw(),
                address.normalized(),
                tokenHasher.hmac(code),
                clock.instant());
        verificationRepository.save(verification);

        // AUTH-05: 기존 계정이면 코드를 보내지 않는다. 대기 레코드는 만들되 아무도 통과할 수 없다 —
        // 코드가 발송되지 않았으므로 그 대기 레코드는 미끼와 같은 성질이 된다.
        if (userRepository.existsByEmailNormalized(address.normalized())) {
            signupMailer.sendExistingAccountGuide(address.raw());
        } else {
            signupMailer.sendOtp(address.raw(), code);
        }
        return verification.id();
    }

    /**
     * 2단계 뒷부분 — OTP를 확인하고 계정을 만든다.
     *
     * <p>여기서 비로소 {@code user}와 소셜 {@code account}가 <b>함께</b> 생긴다. 그 전까지 제공자
     * 신원은 대기 레코드에만 있었다(결정-0015 §결정 4).
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public SocialLoginOutcome completeSignup(UUID verificationId, String code, ClientInfo client) {
        AuthProperties.Otp otp = properties.otp();
        if (!rateLimiter.tryAcquire(
                "otp:confirm:ip:" + client.ipAddress(), otp.confirmIpLimit(), otp.confirmIpWindow())) {
            throw new BusinessException(AuthErrorCode.AUTH_OTP_RATE_LIMITED, "잠시 후 다시 시도해 주세요");
        }

        Verification verification = verificationRepository
                .findForAttempt(verificationId, VerificationPurpose.EMAIL_SIGNUP)
                .filter(Verification::isSocialSignup)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.AUTH_OTP_INVALID, "확인 코드를 다시 확인해 주세요"));

        Instant now = clock.instant();
        VerificationCheck check = verification.attempt(tokenHasher.hmac(code), now);
        verificationRepository.save(verification);
        rejectUnless(check, verification);

        // 이 제공자 신원으로 이미 계정이 생겼는지 마지막으로 본다 (보안 검토 F4).
        // 표 하나로 대기 레코드를 여러 개 만들어 둘 이상을 통과시키면, 이 확인이 없을 때
        // user 삽입까지 성공한 뒤 accounts의 유니크 제약에 걸려 500으로 떨어진다 —
        // 비즈니스 오류를 DB 제약 위반으로 처리하는 셈이라 로그가 오염되고 원인이 가려진다.
        if (accountRepository
                .findByProviderAndProviderAccountId(
                        verification.socialProvider(), verification.socialProviderAccountId())
                .isPresent()) {
            throw new BusinessException(AuthErrorCode.AUTH_SOCIAL_TICKET_INVALID, "다시 로그인해 주세요");
        }

        EmailAddress address = new EmailAddress(verification.targetEmailRaw(), verification.targetEmail());
        User user = User.register(UUID.randomUUID(), address, now);
        if (!userRepository.registerIfEmailAvailable(user)) {
            // 대기 중에 같은 이메일로 다른 가입이 완료됐다 — 연동 경로로 안내한다(AUTH-05)
            throw new BusinessException(AuthErrorCode.AUTH_EMAIL_ALREADY_USED, "이미 가입된 이메일입니다. 로그인 후 연동해 주세요");
        }

        accountRepository.save(Account.social(
                UUID.randomUUID(),
                user.id(),
                verification.socialProvider(),
                verification.socialProviderAccountId(),
                now));

        IssuedSession session = sessionService.issue(user.id(), client);
        return SocialLoginOutcome.signedIn(user.id(), session);
    }

    private void rejectUnless(VerificationCheck check, Verification verification) {
        switch (check) {
            case OK -> {}
            case EXPIRED -> throw new BusinessException(AuthErrorCode.AUTH_OTP_EXPIRED, "확인 코드가 만료되었습니다. 다시 요청해 주세요");
            case ATTEMPTS_EXCEEDED ->
                throw new BusinessException(AuthErrorCode.AUTH_OTP_ATTEMPTS_EXCEEDED, "시도 횟수를 초과했습니다. 코드를 다시 요청해 주세요");
            case ALREADY_CONSUMED -> {
                log.warn("소진된 소셜 가입 대기 레코드 재사용 시도 (verificationId={})", verification.id());
                throw new BusinessException(AuthErrorCode.AUTH_OTP_INVALID, "확인 코드를 다시 확인해 주세요");
            }
            case CODE_MISMATCH -> throw new BusinessException(AuthErrorCode.AUTH_OTP_INVALID, "확인 코드를 다시 확인해 주세요");
            default -> throw new IllegalStateException("처리되지 않은 검증 결과: " + check);
        }
    }
}
