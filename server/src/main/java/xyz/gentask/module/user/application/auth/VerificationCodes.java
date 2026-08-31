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
 * 일회용 코드의 발급과 판정을 한 자리에 모은다.
 *
 * <p>가입과 재설정이 이것을 함께 쓴다. 두 자리가 보관하는 것만 다르고 발급과 검증과 시도 세기는
 * 같으므로, 절차를 여기 두고 무엇을 만들지는 부르는 쪽이 정한다.
 *
 * <p>판정을 조회 · 대조 · 실패 기록 · 소모의 넷으로 나눈 것은 트랜잭션 때문이다. 틀린 횟수는 실패
 * 응답과 함께 남아야 하는데, 부르는 쪽의 트랜잭션 안에서 올리면 그쪽이 던지는 예외에 함께 되감긴다.
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

    /** 가입 코드를 만들어 보낸다. 앞서 보낸 코드는 이 자리에서 갈린다. */
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

    /** 재설정 코드를 만들어 보낸다. */
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

    /** 코드가 그 행의 것과 같은지 본다. 아무것도 바꾸지 않는다. */
    public boolean matches(VerificationCode stored, String rawCode) {
        return rawCode != null && stored.matches(hash(stored.purpose(), rawCode));
    }

    public boolean isExpired(VerificationCode stored) {
        return stored.isExpired(clock.instant());
    }

    /**
     * 틀린 횟수를 올린다. 한도를 채우면 그 코드를 거두고 그 사실을 낸다.
     *
     * <p>부르는 쪽의 트랜잭션과 분리한다. 그래야 부르는 쪽이 실패로 끝내도 이 기록이 남는다.
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

    /** 확인이 끝난 코드를 거둔다. 부르는 쪽의 트랜잭션 안에서 일어난다. */
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
