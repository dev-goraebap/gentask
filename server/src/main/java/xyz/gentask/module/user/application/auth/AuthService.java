package xyz.gentask.module.user.application.auth;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.tracker.Projects;
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

    /** 회원 가입 시 자동 생성되는 기본 프로젝트 이름이다. */
    private static final String DEFAULT_PROJECT_NAME = "내 프로젝트";

    /**
     * 기본 프로젝트의 작업 항목 키 접두어다.
     */
    private static final String DEFAULT_PROJECT_KEY = "MY";

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
    private final Projects projects;
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
            Projects projects,
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
        this.projects = projects;
        this.clock = clock;
        this.timingEqualizerHash = passwordHasher.hash("timing-equalizer");
    }

    // --- 가입 --------------------------------------------------------------------------------------------------------

    /**
     * 회원 가입을 요청하고 해당 이메일로 인증 코드를 발송한다.
     */
    @Transactional
    public void requestSignup(String rawEmail, String rawPassword, String rawNickname) {
        Email email = Email.of(rawEmail);
        // 비밀번호 정책 검증을 먼저 수행한다.
        Password password = Password.of(rawPassword);
        if (userRepository.existsByEmailNormalized(email.normalized())) {
            throw UserErrorCode.EMAIL_ALREADY_USED.raise();
        }
        String nickname = rawNickname == null || rawNickname.isBlank()
                ? null
                : Nickname.of(rawNickname).value();
        verificationCodes.issueForSignup(email, passwordHasher.hash(password.value()), nickname);
    }

    /** 인증 코드를 검증하고 계정과 기본 프로젝트를 생성한다. */
    @Transactional
    public IssuedSession confirmSignup(String rawEmail, String rawCode) {
        Email email = Email.of(rawEmail);
        VerificationCode stored = consumeOrFail(VerificationPurpose.SIGNUP, email, rawCode);

        // 코드 검증 시점과 계정 생성 시점 사이의 이메일 중복을 재검증한다.
        if (userRepository.existsByEmailNormalized(email.normalized())) {
            verificationCodes.consume(stored);
            throw UserErrorCode.EMAIL_ALREADY_USED.raise();
        }

        Instant now = clock.instant();
        Nickname nickname =
                stored.signupNickname() == null ? Nickname.fromEmail(email) : Nickname.of(stored.signupNickname());
        User user = User.create(UUID.randomUUID(), email, nickname, now);
        // 관리자 환경 설정에 지정된 이메일인 경우 관리자 권한을 부여한다.
        if (adminProperties.designates(email.normalized())) {
            user.changeRole(Role.ADMIN, now);
        }
        userRepository.save(user);
        accountRepository.save(
                Account.createCredential(UUID.randomUUID(), user.id(), email, stored.signupPasswordHash(), now));
        verificationCodes.consume(stored);

        // 신규 사용자가 즉시 작업 관리를 시작할 수 있도록 기본 프로젝트를 생성한다(PRJ-001 A3).
        projects.create(user.id(), DEFAULT_PROJECT_NAME, DEFAULT_PROJECT_KEY);

        return issueSession(user.id(), now);
    }

    /** 가입 인증 코드를 재발송한다. 기존 인증 코드는 대체된다. */
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
     * 비밀번호 재설정 인증 코드를 발송한다. 미등록 이메일인 경우에도 동일한 성공 응답을 반환하여 이메일 존재 여부 노출을 방지한다.
     */
    @Transactional
    public void requestPasswordReset(String rawEmail) {
        Email email = Email.of(rawEmail);
        if (accountRepository.findCredential(email.normalized()).isPresent()) {
            verificationCodes.issueForPasswordReset(email);
        }
    }

    /** 인증 코드를 검증하고 비밀번호를 변경한 후 기존 세션 및 API 토큰을 모두 만료 처리한다. */
    @Transactional
    public void confirmPasswordReset(String rawEmail, String rawCode, String rawNewPassword) {
        Email email = Email.of(rawEmail);
        // 새 비밀번호의 정책 검증을 먼저 수행하여 실패 시 기존 인증 코드가 소모되지 않도록 한다.
        Password newPassword = Password.of(rawNewPassword);
        VerificationCode stored = consumeOrFail(VerificationPurpose.PASSWORD_RESET, email, rawCode);

        Account account = accountRepository
                .findCredential(email.normalized())
                .orElseThrow(UserErrorCode.VERIFICATION_CODE_EXPIRED::raise);
        account.changePassword(passwordHasher.hash(newPassword.value()), clock.instant());
        accountRepository.save(account);

        // 보안을 위해 비밀번호 재설정 완료 시 기존 세션 및 API 토큰을 전부 만료 처리한다.
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
     * 인증 코드를 조회하여 검증한다. 코드 미존재, 만료, 실패 횟수 초과 시 동일하게 만료 예외를 반환한다.
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
