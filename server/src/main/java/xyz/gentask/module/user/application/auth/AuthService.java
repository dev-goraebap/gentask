package xyz.gentask.module.user.application.auth;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.user.application.AdminProperties;
import xyz.gentask.module.user.application.PasswordHasher;
import xyz.gentask.module.user.application.TokenGenerator;
import xyz.gentask.module.user.application.TokenHasher;
import xyz.gentask.module.user.application.UserErrorCode;
import xyz.gentask.module.user.domain.Email;
import xyz.gentask.module.user.domain.Password;
import xyz.gentask.module.user.domain.account.Account;
import xyz.gentask.module.user.domain.account.AccountRepository;
import xyz.gentask.module.user.domain.apitoken.ApiTokenRepository;
import xyz.gentask.module.user.domain.session.Session;
import xyz.gentask.module.user.domain.session.SessionRepository;
import xyz.gentask.module.user.domain.user.Nickname;
import xyz.gentask.module.user.domain.user.Role;
import xyz.gentask.module.user.domain.user.User;
import xyz.gentask.module.user.domain.user.UserRepository;
import xyz.gentask.module.user.domain.verification.VerificationCode;
import xyz.gentask.module.user.domain.verification.VerificationPurpose;

@Service
public class AuthService {

    public record IssuedSession(String token, Instant expiresAt) {}

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final SessionRepository sessionRepository;
    private final ApiTokenRepository apiTokenRepository;
    private final VerificationCodes verificationCodes;
    private final PasswordHasher passwordHasher;
    private final TokenHasher tokenHasher;
    private final TokenGenerator tokenGenerator;
    private final AuthProperties properties;
    private final AdminProperties adminProperties;
    private final Clock clock;

    private final String timingEqualizerHash;

    // --- 생성 --------------------------------------------------------------------------------------------------------
    @SuppressWarnings("checkstyle:ParameterNumber")
    public AuthService(
            UserRepository userRepository,
            AccountRepository accountRepository,
            SessionRepository sessionRepository,
            ApiTokenRepository apiTokenRepository,
            VerificationCodes verificationCodes,
            PasswordHasher passwordHasher,
            TokenHasher tokenHasher,
            TokenGenerator tokenGenerator,
            AuthProperties properties,
            AdminProperties adminProperties,
            Clock clock) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.sessionRepository = sessionRepository;
        this.apiTokenRepository = apiTokenRepository;
        this.verificationCodes = verificationCodes;
        this.passwordHasher = passwordHasher;
        this.tokenHasher = tokenHasher;
        this.tokenGenerator = tokenGenerator;
        this.properties = properties;
        this.adminProperties = adminProperties;
        this.clock = clock;
        this.timingEqualizerHash = passwordHasher.hash("timing-equalizer");
    }

    // --- 가입 --------------------------------------------------------------------------------------------------------

    /**
     * 가입을 시작하고 그 주소로 코드를 보낸다. 계정은 아직 만들지 않는다.
     *
     * <p>메일 발송이 이 트랜잭션 안에 있어 보내지 못하면 코드도 남지 않는다. 저장해 두고 메일만
     * 실패한 상태를 만들면 사용자는 오지 않을 코드를 기다리게 된다.
     */
    @Transactional
    public void requestSignup(String rawEmail, String rawPassword, String rawNickname) {
        Email email = Email.of(rawEmail);
        // 규칙 검증을 먼저 한다. 코드를 보낸 뒤에 거절하면 그 메일이 헛것이 된다.
        Password password = Password.of(rawPassword);
        if (userRepository.existsByEmailNormalized(email.normalized())) {
            throw UserErrorCode.EMAIL_ALREADY_USED.raise();
        }
        String nickname = rawNickname == null || rawNickname.isBlank()
                ? null
                : Nickname.of(rawNickname).value();
        verificationCodes.issueForSignup(email, passwordHasher.hash(password.value()), nickname);
    }

    /** 코드를 확인하고 계정을 만든다. 이 자리가 계정이 처음 생기는 곳이다. */
    @Transactional
    public IssuedSession confirmSignup(String rawEmail, String rawCode) {
        Email email = Email.of(rawEmail);
        VerificationCode stored = consumeOrFail(VerificationPurpose.SIGNUP, email, rawCode);

        // 요청과 이 시점 사이에 그 이메일이 쓰이게 되었을 수 있다. 두 검사가 떨어져 있어 그 사이가 비어 있다.
        if (userRepository.existsByEmailNormalized(email.normalized())) {
            verificationCodes.consume(stored);
            throw UserErrorCode.EMAIL_ALREADY_USED.raise();
        }

        Instant now = clock.instant();
        Nickname nickname =
                stored.signupNickname() == null ? Nickname.fromEmail(email) : Nickname.of(stored.signupNickname());
        User user = User.create(UUID.randomUUID(), email, nickname, now);
        // 설정이 가리키는 계정이 뒤늦게 가입할 수 있다. 기동 시의 승격만 두면 그 계정이 일반 사용자로 남는다.
        if (adminProperties.designates(email.normalized())) {
            user.changeRole(Role.ADMIN, now);
        }
        userRepository.save(user);
        accountRepository.save(
                Account.createCredential(UUID.randomUUID(), user.id(), email, stored.signupPasswordHash(), now));
        verificationCodes.consume(stored);

        return issueSession(user.id(), now);
    }

    /** 코드를 다시 보낸다. 앞서 보낸 것은 갈린다. */
    @Transactional
    public void resendSignupCode(String rawEmail) {
        Email email = Email.of(rawEmail);
        VerificationCode stored = verificationCodes
                .find(VerificationPurpose.SIGNUP, email)
                .orElseThrow(UserErrorCode.VERIFICATION_CODE_EXPIRED::raise);
        if (userRepository.existsByEmailNormalized(email.normalized())) {
            throw UserErrorCode.EMAIL_ALREADY_USED.raise();
        }
        verificationCodes.issueForSignup(email, stored.signupPasswordHash(), stored.signupNickname());
    }

    // --- 로그인 -------------------------------------------------------------------------------------------------------

    @Transactional
    public IssuedSession login(String rawEmail, String rawPassword) {
        Email email = Email.of(rawEmail);
        Account account = accountRepository.findCredential(email.normalized()).orElse(null);

        if (account == null) {
            passwordHasher.matches(rawPassword, timingEqualizerHash);
            throw UserErrorCode.INVALID_CREDENTIALS.raise();
        }
        if (!passwordHasher.matches(rawPassword, account.passwordHash())) {
            throw UserErrorCode.INVALID_CREDENTIALS.raise();
        }

        return issueSession(account.userId(), clock.instant());
    }

    @Transactional
    public void logout(UUID sessionId) {
        sessionRepository.deleteById(sessionId);
    }

    // --- 비밀번호 재설정 -------------------------------------------------------------------------------------------------

    /**
     * 재설정 코드를 보낸다.
     *
     * <p>등록되지 않은 이메일이면 아무것도 하지 않고 같은 응답으로 끝낸다. 구분해 알리면 그 차이가
     * 곧 가입 여부를 알려 주는 신호가 된다.
     */
    @Transactional
    public void requestPasswordReset(String rawEmail) {
        Email email = Email.of(rawEmail);
        if (accountRepository.findCredential(email.normalized()).isPresent()) {
            verificationCodes.issueForPasswordReset(email);
        }
    }

    /** 코드를 확인하고 비밀번호를 갈아 끼운 뒤 그 계정의 세션과 API 토큰을 모두 거둔다. */
    @Transactional
    public void confirmPasswordReset(String rawEmail, String rawCode, String rawNewPassword) {
        Email email = Email.of(rawEmail);
        // 규칙을 먼저 본다. 그래야 규칙에 걸렸을 때 코드가 그대로 남아 다시 제출할 수 있다.
        Password newPassword = Password.of(rawNewPassword);
        VerificationCode stored = consumeOrFail(VerificationPurpose.PASSWORD_RESET, email, rawCode);

        Account account = accountRepository
                .findCredential(email.normalized())
                .orElseThrow(UserErrorCode.VERIFICATION_CODE_EXPIRED::raise);
        account.changePassword(passwordHasher.hash(newPassword.value()), clock.instant());
        accountRepository.save(account);

        // 비밀번호를 모르는 채 지나는 경로다. 앞서 열린 자리들이 정당하다고 볼 근거가 남지 않는다.
        sessionRepository.deleteByUserId(account.userId());
        apiTokenRepository.deleteByUserId(account.userId());
        verificationCodes.consume(stored);
    }

    @Transactional
    public void resendPasswordResetCode(String rawEmail) {
        requestPasswordReset(rawEmail);
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------

    /**
     * 코드를 찾아 대조한다. 통과하면 그 행을 내고, 거두는 것은 부르는 쪽이 한다.
     *
     * <p>없는 코드와 만료된 코드와 한도를 채운 코드가 같은 응답을 낸다. 나누면 몇 번 남았는지와 그
     * 주소로 요청이 있었는지가 밖으로 드러난다.
     */
    private VerificationCode consumeOrFail(VerificationPurpose purpose, Email email, String rawCode) {
        VerificationCode stored =
                verificationCodes.find(purpose, email).orElseThrow(UserErrorCode.VERIFICATION_CODE_EXPIRED::raise);
        if (verificationCodes.isExpired(stored)) {
            verificationCodes.discard(purpose, email);
            throw UserErrorCode.VERIFICATION_CODE_EXPIRED.raise();
        }
        if (!verificationCodes.matches(stored, rawCode)) {
            boolean exhausted = verificationCodes.recordFailure(stored);
            throw exhausted
                    ? UserErrorCode.VERIFICATION_CODE_EXPIRED.raise()
                    : UserErrorCode.VERIFICATION_CODE_MISMATCH.raise();
        }
        return stored;
    }

    private IssuedSession issueSession(UUID userId, Instant now) {
        String token = tokenGenerator.generate();
        Session session = Session.issue(
                UUID.randomUUID(),
                userId,
                tokenHasher.hmac(TokenHasher.Purpose.SESSION, token),
                now,
                properties.session().ttl());
        sessionRepository.save(session);
        return new IssuedSession(token, session.expiresAt());
    }
}
