package xyz.gentask.module.notification.application;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * VAPID 키 쌍. 공개 키는 브라우저가 구독할 때 필요하므로 화면에 내려가고, 개인 키는 서버가 알림에
 * 서명할 때만 쓰며 밖으로 나가지 않는다.
 *
 * @param publicKey base64url 로 인코딩된 P-256 공개 키
 * @param privateKey base64url 로 인코딩된 P-256 개인 키
 * @param subject 푸시 서비스가 문제 발생 시 연락할 자리. `mailto:` 또는 `https:` 로 시작한다
 */
@ConfigurationProperties(prefix = "app.push.vapid")
public record VapidProperties(String publicKey, String privateKey, String subject) {

    public boolean isConfigured() {
        return publicKey != null && !publicKey.isBlank() && privateKey != null && !privateKey.isBlank();
    }
}
