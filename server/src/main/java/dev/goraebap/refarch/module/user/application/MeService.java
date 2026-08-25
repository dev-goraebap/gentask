package dev.goraebap.refarch.module.user.application;

import dev.goraebap.refarch.module.user.application.UserViews.IssuedApiToken;
import dev.goraebap.refarch.module.user.application.UserViews.MeView;
import dev.goraebap.refarch.module.user.domain.apitoken.ApiToken;
import dev.goraebap.refarch.module.user.domain.apitoken.ApiTokenRepository;
import dev.goraebap.refarch.module.user.domain.user.Nickname;
import dev.goraebap.refarch.module.user.domain.user.User;
import dev.goraebap.refarch.module.user.domain.user.UserRepository;
import dev.goraebap.refarch.shared.storage.ObjectStorage;
import dev.goraebap.refarch.shared.storage.PresignedUpload;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MeService {

    // --- 상수 --------------------------------------------------------------------------------------------------------
    static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024;

    private static final Duration UPLOAD_EXPIRY = Duration.ofMinutes(10);

    private static final Duration VIEW_EXPIRY = Duration.ofMinutes(30);

    // --- 의존 --------------------------------------------------------------------------------------------------------
    private final UserRepository userRepository;
    private final ApiTokenRepository apiTokenRepository;
    private final ObjectStorage objectStorage;
    private final TokenHasher tokenHasher;
    private final TokenGenerator tokenGenerator;
    private final Clock clock;

    // --- 조회 --------------------------------------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public MeView me(UUID userId) {
        User user = find(userId);
        Instant tokenIssuedAt =
                apiTokenRepository.findByUserId(userId).map(ApiToken::createdAt).orElse(null);
        String profileImageUrl = user.profileImageKey() == null
                ? null
                : objectStorage.presignGet(user.profileImageKey(), null, VIEW_EXPIRY);
        return new MeView(
                user.id(),
                user.email().value(),
                user.nickname().value(),
                profileImageUrl,
                tokenIssuedAt,
                user.createdAt());
    }

    @Transactional(readOnly = true)
    public PresignedUpload presignProfileImage(UUID userId, String fileName, String contentType, long size) {
        find(userId);
        if (!contentType.startsWith("image/")) {
            throw UserErrorCode.PROFILE_IMAGE_NOT_IMAGE.raise();
        }
        if (size > MAX_IMAGE_BYTES) {
            throw UserErrorCode.PROFILE_IMAGE_TOO_LARGE.raise();
        }
        String objectKey = "users/" + userId + "/avatar/" + UUID.randomUUID();
        return new PresignedUpload(objectKey, objectStorage.presignPut(objectKey, contentType, UPLOAD_EXPIRY));
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
        User user = find(userId);
        if (!objectKey.startsWith("users/" + userId + "/")) {
            throw UserErrorCode.PROFILE_IMAGE_NOT_UPLOADED.raise();
        }
        long actualSize = objectStorage.sizeOf(objectKey).orElseThrow(UserErrorCode.PROFILE_IMAGE_NOT_UPLOADED::raise);
        if (actualSize > MAX_IMAGE_BYTES) {
            objectStorage.delete(objectKey);
            throw UserErrorCode.PROFILE_IMAGE_TOO_LARGE.raise();
        }

        String previousKey = user.profileImageKey();
        user.changeProfileImage(objectKey, clock.instant());
        userRepository.save(user);
        if (previousKey != null) {
            objectStorage.delete(previousKey);
        }
    }

    @Transactional
    public void clearProfileImage(UUID userId) {
        User user = find(userId);
        String previousKey = user.profileImageKey();
        user.clearProfileImage(clock.instant());
        userRepository.save(user);
        if (previousKey != null) {
            objectStorage.delete(previousKey);
        }
    }

    // --- 보조 --------------------------------------------------------------------------------------------------------
    private User find(UUID userId) {
        return userRepository.findById(userId).orElseThrow(UserErrorCode.USER_NOT_FOUND::raise);
    }
}
