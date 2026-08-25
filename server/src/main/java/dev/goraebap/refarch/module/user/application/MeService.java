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

/** TK-006. */
@Service
@RequiredArgsConstructor
public class MeService {

    /** 파일 첨부(TK-003 A11)와 같은 상한이다. */
    static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024;

    /** 올리기 창. 이 안에 PUT 이 끝나야 한다. */
    private static final Duration UPLOAD_EXPIRY = Duration.ofMinutes(10);

    /** 표시용 주소의 수명. 화면은 저장하지 않고 /me 를 다시 받을 때마다 새 주소를 얻는다. */
    private static final Duration VIEW_EXPIRY = Duration.ofMinutes(30);

    private final UserRepository userRepository;
    private final ApiTokenRepository apiTokenRepository;
    private final ObjectStorage objectStorage;
    private final TokenHasher tokenHasher;
    private final TokenGenerator tokenGenerator;
    private final Clock clock;

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

    /** TK-006 기본 흐름. */
    @Transactional
    public void changeNickname(UUID userId, String rawNickname) {
        User user = find(userId);
        user.changeNickname(Nickname.of(rawNickname), clock.instant());
        userRepository.save(user);
    }

    /** TK-006 A3. 재발급이 곧 교체이므로 이전 토큰은 이 호출로 무효가 된다. */
    @Transactional
    public IssuedApiToken issueApiToken(UUID userId) {
        find(userId);
        Instant now = clock.instant();
        String token = tokenGenerator.generate();
        apiTokenRepository.save(
                ApiToken.issue(UUID.randomUUID(), userId, tokenHasher.hmac(TokenHasher.Purpose.API_TOKEN, token), now));
        return new IssuedApiToken(token, now);
    }

    /** TK-006 A3. 지우면 그 토큰의 접근이 끊긴다. */
    @Transactional
    public void deleteApiToken(UUID userId) {
        apiTokenRepository.deleteByUserId(userId);
    }

    /** TK-006 A1. 검증에 걸리면 URL 을 내주지 않아 올리기 자체가 시작되지 않는다. */
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

    /**
     * TK-006 A1 의 확정. 크기는 클라이언트 말이 아니라 보관소의 실측을 믿는다.
     *
     * 키가 내 자리(users/{id}/) 밖이면 받지 않는다. presign 을 거치지 않은 키로 남의
     * 오브젝트를 아바타 삼는 것을 막는다.
     */
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

    /** TK-006 A2. */
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

    private User find(UUID userId) {
        return userRepository.findById(userId).orElseThrow(UserErrorCode.USER_NOT_FOUND::raise);
    }
}
