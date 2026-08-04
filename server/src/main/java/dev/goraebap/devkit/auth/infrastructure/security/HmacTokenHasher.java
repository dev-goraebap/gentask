package dev.goraebap.devkit.auth.infrastructure.security;

import dev.goraebap.devkit.auth.application.shared.AuthProperties;
import dev.goraebap.devkit.auth.application.shared.HmacPurpose;
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

    /**
     * 용도 라벨을 값 앞에 붙여 계산한다 — {@code "session:<토큰>"} 형태다.
     *
     * <p>구분자 {@code :}는 라벨 집합({@link HmacPurpose})이 소문자 영문뿐이라 안전하다.
     * 라벨에 {@code :}가 들어갈 수 있게 되면 {@code "a:b"}와 {@code "a"} + {@code ":b"}가
     * 같은 입력이 되므로, 그때는 길이 접두 방식으로 바꿔야 한다.
     */
    @Override
    public String hmac(HmacPurpose purpose, String value) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(key);
            String input = purpose.label() + ":" + value;
            return HexFormat.of().formatHex(mac.doFinal(input.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HMAC 계산에 실패했다", e);
        }
    }
}
