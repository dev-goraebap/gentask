package dev.goraebap.refarch.module.user.application.me;

import dev.goraebap.refarch.module.file.AttachmentSlot;
import dev.goraebap.refarch.module.file.AttachmentView;
import dev.goraebap.refarch.module.file.Attachments;
import dev.goraebap.refarch.module.user.application.PasswordHasher;
import dev.goraebap.refarch.module.user.application.TokenGenerator;
import dev.goraebap.refarch.module.user.application.TokenHasher;
import dev.goraebap.refarch.module.user.application.UserErrorCode;
import dev.goraebap.refarch.module.user.application.me.UserViews.IssuedApiToken;
import dev.goraebap.refarch.module.user.application.me.UserViews.MeView;
import dev.goraebap.refarch.module.user.domain.Password;
import dev.goraebap.refarch.module.user.domain.account.Account;
import dev.goraebap.refarch.module.user.domain.account.AccountRepository;
import dev.goraebap.refarch.module.user.domain.apitoken.ApiToken;
import dev.goraebap.refarch.module.user.domain.apitoken.ApiTokenRepository;
import dev.goraebap.refarch.module.user.domain.session.SessionRepository;
import dev.goraebap.refarch.module.user.domain.user.Nickname;
import dev.goraebap.refarch.module.user.domain.user.User;
import dev.goraebap.refarch.module.user.domain.user.UserRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
     * 비밀번호를 갈아 끼우고 지금 쓰는 자리를 뺀 나머지 세션을 거둔다.
     *
     * <p>현재 비밀번호를 다시 받는 것은, 로그인 상태만으로 바꾸게 하면 자리를 비운 사이 남이 그
     * 화면을 열어 주인을 밀어낼 수 있기 때문이다.
     *
     * <p>API 토큰은 남긴다. 그것을 거두는 자리는 비밀번호 재설정이며, 비밀번호를 모르는 채 지나는
     * 그 경로만이 앞선 자리들을 의심할 근거를 갖는다.
     *
     * @param currentSessionId 남길 자리. Bearer 토큰으로 부르면 없으며 그때는 모두 거둔다
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
        // 자리 하나뿐인 slot 이라 붙이는 것이 곧 앞의 것을 밀어내는 것이다
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
