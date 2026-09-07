package xyz.gentask.module.user.application.auth;

import java.time.Clock;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.user.application.AdminProperties;
import xyz.gentask.module.user.application.TokenHasher;
import xyz.gentask.module.user.application.UserErrorCode;
import xyz.gentask.module.user.domain.Email;
import xyz.gentask.module.user.domain.user.Nickname;
import xyz.gentask.module.user.domain.user.Role;
import xyz.gentask.module.user.domain.user.User;
import xyz.gentask.module.user.domain.user.UserRepository;
import xyz.gentask.module.user.domain.verification.VerificationCode;
import xyz.gentask.module.user.domain.verification.VerificationCodeRepository;
import xyz.gentask.module.user.domain.verification.VerificationPurpose;
import xyz.gentask.shared.error.BusinessException;
import xyz.gentask.shared.mail.MailSender;

@Service
@RequiredArgsConstructor
public class EmailLoginService {
    private final VerificationCodeRepository codes;
    private final VerificationCodeGenerator generator;
    private final TokenHasher hasher;
    private final CredentialProperties properties;
    private final MailSender mail;
    private final UserRepository users;
    private final AdminProperties admins;
    private final AuthService sessions;
    private final Clock clock;
    private final xyz.gentask.module.project.ProjectCreationIn projects;

    @Transactional
    public void request(String rawEmail) {
        Email email = Email.of(rawEmail);
        codes.ensureLoginSlot(email.normalized());
        var previous = codes.findForUpdate(email.normalized(), VerificationPurpose.LOGIN);
        if (previous.isPresent()
                && clock.instant().isBefore(previous.get().createdAt().plus(Duration.ofMinutes(1)))) {
            throw UserErrorCode.CODE_REQUEST_TOO_SOON.raise();
        }
        String code = generator.generate();
        codes.save(VerificationCode.restore(
                UUID.randomUUID(),
                VerificationPurpose.LOGIN,
                email.normalized(),
                hasher.hmac(TokenHasher.Purpose.LOGIN_CODE, code),
                null,
                null,
                0,
                clock.instant().plus(properties.codeTtl()),
                clock.instant()));
        mail.send(
                email.value(),
                "[Gentask] 로그인 인증번호",
                "로그인하려면 아래 인증번호를 입력해 주세요.\n\n    " + code + "\n\n"
                        + properties.codeTtl().toMinutes() + "분 동안 유효합니다. 요청하지 않았다면 무시해 주세요.");
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public AuthService.IssuedSession confirm(String rawEmail, String rawCode) {
        Email email = Email.of(rawEmail);
        var code = codes.findForUpdate(email.normalized(), VerificationPurpose.LOGIN)
                .orElseThrow(UserErrorCode.VERIFICATION_CODE_EXPIRED::raise);
        if (code.isExpired(clock.instant())) throw UserErrorCode.VERIFICATION_CODE_EXPIRED.raise();
        if (!code.matches(hasher.hmac(TokenHasher.Purpose.LOGIN_CODE, rawCode))) {
            if (code.recordFailure(properties.maxAttempts())) {
                expire(code);
                throw UserErrorCode.VERIFICATION_CODE_EXPIRED.raise();
            }
            codes.save(code);
            throw UserErrorCode.VERIFICATION_CODE_MISMATCH.raise();
        }
        User user = users.findByEmailNormalized(email.normalized()).orElseGet(() -> {
            User created = User.create(UUID.randomUUID(), email, Nickname.fromEmail(email), clock.instant());
            if (admins.designates(email.normalized())) created.changeRole(Role.ADMIN, clock.instant());
            users.save(created);
            projects.create(created.id(), "내 프로젝트", "MY");
            return created;
        });
        expire(code);
        return sessions.issueSession(user.id(), clock.instant());
    }

    private void expire(VerificationCode code) {
        codes.save(VerificationCode.restore(
                code.id(),
                code.purpose(),
                code.emailNormalized(),
                "",
                null,
                null,
                code.attempts(),
                java.time.Instant.EPOCH,
                code.createdAt()));
    }
}
