package xyz.gentask.module.user.application.auth;

import java.time.Clock;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.user.application.TokenHasher;
import xyz.gentask.module.user.domain.Email;
import xyz.gentask.module.user.domain.verification.VerificationCode;
import xyz.gentask.module.user.domain.verification.VerificationCodeRepository;
import xyz.gentask.module.user.domain.verification.VerificationPurpose;
import xyz.gentask.shared.mail.MailSender;

/**
 * 일회용 인증 코드의 발급, 검증, 만료 관리를 담당하는 컴포넌트다.
 */
@Component
@RequiredArgsConstructor
public class VerificationCodes {

    private final VerificationCodeRepository repository;
    private final VerificationCodeGenerator generator;
    private final TokenHasher tokenHasher;
    private final MailSender mailSender;
    private final CredentialProperties properties;
    private final Clock clock;

    // --- 발급 --------------------------------------------------------------------------------------------------------

    /** 가입 코드를 생성하여 메일로 발송한다. 동일 이메일의 기존 코드는 대체된다. */
    @Transactional
    public void issueForSignup(Email email, String passwordHash, String nickname) {
        String code = generator.generate();
        repository.save(VerificationCode.forSignup(
                UUID.randomUUID(),
                email,
                hash(VerificationPurpose.SIGNUP, code),
                passwordHash,
                nickname,
                clock.instant(),
                properties.codeTtl()));
        send(email, code, "가입", "가입을 마치려면 아래 코드를 입력해 주세요.");
    }

    /** 비밀번호 재설정 코드를 생성하여 메일로 발송한다. */
    @Transactional
    public void issueForPasswordReset(Email email) {
        String code = generator.generate();
        repository.save(VerificationCode.forPasswordReset(
                UUID.randomUUID(),
                email,
                hash(VerificationPurpose.PASSWORD_RESET, code),
                clock.instant(),
                properties.codeTtl()));
        send(email, code, "비밀번호 재설정", "비밀번호를 새로 정하려면 아래 코드를 입력해 주세요.");
    }

    // --- 판정 --------------------------------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Optional<VerificationCode> find(VerificationPurpose purpose, Email email) {
        return repository.find(email.normalized(), purpose);
    }

    /** 입력된 인증 코드가 저장된 해시와 일치하는지 검증한다. */
    public boolean matches(VerificationCode stored, String rawCode) {
        return rawCode != null && stored.matches(hash(stored.purpose(), rawCode));
    }

    public boolean isExpired(VerificationCode stored) {
        return stored.isExpired(clock.instant());
    }

    /**
     * 인증 실패 횟수를 증가시키고 한도 도달 여부를 반환한다. 별도 트랜잭션으로 커밋하여 실패 횟수를 보존한다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean recordFailure(VerificationCode stored) {
        boolean exhausted = stored.recordFailure(properties.maxAttempts());
        if (exhausted) {
            repository.delete(stored.emailNormalized(), stored.purpose());
        } else {
            repository.save(stored);
        }
        return exhausted;
    }

    /** 인증이 완료된 코드를 삭제 처리한다. */
    public void consume(VerificationCode stored) {
        repository.delete(stored.emailNormalized(), stored.purpose());
    }

    @Transactional
    public void discard(VerificationPurpose purpose, Email email) {
        repository.delete(email.normalized(), purpose);
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------

    private String hash(VerificationPurpose purpose, String code) {
        return tokenHasher.hmac(
                purpose == VerificationPurpose.SIGNUP
                        ? TokenHasher.Purpose.SIGNUP_CODE
                        : TokenHasher.Purpose.PASSWORD_RESET_CODE,
                code);
    }

    private void send(Email email, String code, String what, String guide) {
        long minutes = Duration.ofSeconds(properties.codeTtl().toSeconds()).toMinutes();
        String body =
                guide + "\n\n    " + code + "\n\n" + "이 코드는 " + minutes + "분 뒤에 만료됩니다.\n" + "요청한 적이 없다면 이 메일을 무시해 주세요.";
        mailSender.send(email.value(), "[gentask] %s 코드".formatted(what), body);
    }
}
