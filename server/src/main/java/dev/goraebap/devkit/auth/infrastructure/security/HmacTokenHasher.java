package dev.goraebap.devkit.auth.infrastructure.security;

import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import dev.goraebap.devkit.auth.application.shared.TokenHasher;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

/**
 * 앱 시크릿을 키로 하는 HMAC-SHA256 (설계/데이터베이스.md §1.4).
 *
 * <p>{@link Mac} 인스턴스는 스레드 안전하지 않으므로 호출마다 생성한다 — 비용은 마이크로초
 * 단위다.
 */
@Component
class HmacTokenHasher implements TokenHasher {

    private static final String ALGORITHM = "HmacSHA256";

    private final SecretKeySpec key;

    // 생성자를 손으로 둔다 (결정-0023의 예외): 받은 값을 그대로 담지 않고 키를 만들어 담는다.
    HmacTokenHasher(AuthProperties properties) {
        this.key = new SecretKeySpec(properties.secret().getBytes(StandardCharsets.UTF_8), ALGORITHM);
    }

    @Override
    public String hmac(String value) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(key);
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HMAC 계산에 실패했다", e);
        }
    }
}
