package xyz.gentask.module.user.application.me;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.file.AttachmentSlot;
import xyz.gentask.module.file.AttachmentView;
import xyz.gentask.module.file.Attachments;
import xyz.gentask.module.user.application.PasswordHasher;
import xyz.gentask.module.user.application.TokenGenerator;
import xyz.gentask.module.user.application.TokenHasher;
import xyz.gentask.module.user.application.UserErrorCode;
import xyz.gentask.module.user.application.me.UserViews.IssuedApiToken;
import xyz.gentask.module.user.application.me.UserViews.MeView;
import xyz.gentask.module.user.domain.Password;
import xyz.gentask.module.user.domain.account.Account;
import xyz.gentask.module.user.domain.account.AccountRepository;
import xyz.gentask.module.user.domain.apitoken.ApiToken;
import xyz.gentask.module.user.domain.apitoken.ApiTokenRepository;
import xyz.gentask.module.user.domain.session.SessionRepository;
import xyz.gentask.module.user.domain.user.Nickname;
import xyz.gentask.module.user.domain.user.User;
import xyz.gentask.module.user.domain.user.UserRepository;

@Service
@RequiredArgsConstructor
public class MeService {

    // --- 상수 --------------------------------------------------------------------------------------------------------
    private static final AttachmentSlot SLOT = AttachmentSlot.USER_PROFILE_IMAGE;

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final SessionRepository sessionRepository;
    private final ApiTokenRepository apiTokenRepository;
    private final PasswordHasher passwordHasher;
    private final Attachments attachments;
    private final TokenHasher tokenHasher;
    private final TokenGenerator tokenGenerator;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public MeView me(UUID userId) {
        User user = find(userId);
        Instant tokenIssuedAt =
                apiTokenRepository.findByUserId(userId).map(ApiToken::createdAt).orElse(null);
        String profileImageUrl =
                attachments.findSingle(SLOT, userId).map(AttachmentView::url).orElse(null);
        return new MeView(
                user.id(),
                user.email().value(),
                user.nickname().value(),
                user.role().name(),
                profileImageUrl,
                tokenIssuedAt,
                user.createdAt());
    }

    // --- 명령 --------------------------------------------------------------------------------------------------------
    @Transactional
    public void changeNickname(UUID userId, String rawNickname) {
        User user = find(userId);
        user.changeNickname(Nickname.of(rawNickname), clock.instant());
        userRepository.save(user);
    }

    /**
     * 비밀번호를 변경하고 현재 세션을 제외한 다른 모든 세션을 만료 처리한다.
     *
     * @param currentSessionId 유지할 현재 세션 식별자. Bearer 토큰 요청 시 null이며 이때는 모든 세션을 만료 처리한다
     */
    @Transactional
    public void changePassword(UUID userId, UUID currentSessionId, String rawCurrent, String rawNew) {
        Account account =
                accountRepository.findCredentialByUserId(userId).orElseThrow(UserErrorCode.USER_NOT_FOUND::raise);
        if (!passwordHasher.matches(rawCurrent, account.passwordHash())) {
            throw UserErrorCode.CURRENT_PASSWORD_MISMATCH.raise();
        }
        Password newPassword = Password.of(rawNew);
        if (passwordHasher.matches(newPassword.value(), account.passwordHash())) {
            throw UserErrorCode.SAME_PASSWORD.raise();
        }
        account.changePassword(passwordHasher.hash(newPassword.value()), clock.instant());
        accountRepository.save(account);
        sessionRepository.deleteByUserIdExcept(userId, currentSessionId);
    }

    @Transactional
    public IssuedApiToken issueApiToken(UUID userId) {
        find(userId);
        Instant now = clock.instant();
        String token = tokenGenerator.generate();
        apiTokenRepository.save(
                ApiToken.issue(UUID.randomUUID(), userId, tokenHasher.hmac(TokenHasher.Purpose.API_TOKEN, token), now));
        return new IssuedApiToken(token, now);
    }

    @Transactional
    public void deleteApiToken(UUID userId) {
        apiTokenRepository.deleteByUserId(userId);
    }

    @Transactional
    public void confirmProfileImage(UUID userId, String objectKey) {
        find(userId);
        // 단일 슬롯이므로 새 이미지를 첨부하면 기존 프로필 이미지가 자동으로 대체된다.
        attachments.attach(SLOT, userId, userId, objectKey);
    }

    @Transactional
    public void clearProfileImage(UUID userId) {
        find(userId);
        attachments.detachAll(SLOT, userId);
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------
    private User find(UUID userId) {
        return userRepository.findById(userId).orElseThrow(UserErrorCode.USER_NOT_FOUND::raise);
    }
}
