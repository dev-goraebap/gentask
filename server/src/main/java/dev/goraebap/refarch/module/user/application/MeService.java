package dev.goraebap.refarch.module.user.application;

import dev.goraebap.refarch.module.file.AttachmentSlot;
import dev.goraebap.refarch.module.file.AttachmentView;
import dev.goraebap.refarch.module.file.Attachments;
import dev.goraebap.refarch.module.user.application.UserViews.IssuedApiToken;
import dev.goraebap.refarch.module.user.application.UserViews.MeView;
import dev.goraebap.refarch.module.user.domain.apitoken.ApiToken;
import dev.goraebap.refarch.module.user.domain.apitoken.ApiTokenRepository;
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
    private final ApiTokenRepository apiTokenRepository;
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
