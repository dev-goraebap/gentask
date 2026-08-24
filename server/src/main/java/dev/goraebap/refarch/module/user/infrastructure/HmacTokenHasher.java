package dev.goraebap.refarch.module.user.infrastructure;

import dev.goraebap.refarch.module.user.application.AuthProperties;
import dev.goraebap.refarch.module.user.application.TokenHasher;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** HMAC-SHA256 hex 64자. 키는 auth.secret 이고, 용도 라벨을 접두로 섞는다. */
@Component
@RequiredArgsConstructor
class HmacTokenHasher implements TokenHasher {

    private final AuthProperties properties;

    @Override
    public String hmac(Purpose purpose, String token) {
        try {
            // Mac 은 스레드 안전하지 않아 호출마다 만든다. 초기화 비용은 조회 비용에 비해 무시할 만하다.
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal((purpose.label() + ":" + token).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (GeneralSecurityException generalSecurityException) {
            // HmacSHA256 은 모든 JVM 에 있다. 여기 오면 환경이 깨진 것이다.
            throw new IllegalStateException("HMAC 계산에 실패했습니다", generalSecurityException);
        }
    }
}
