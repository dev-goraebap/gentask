package dev.goraebap.refarch.module.user.infrastructure;

import dev.goraebap.refarch.module.user.application.TokenHasher;
import dev.goraebap.refarch.module.user.application.auth.AuthProperties;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class HmacTokenHasher implements TokenHasher {

    private final AuthProperties properties;

    @Override
    public String hmac(Purpose purpose, String token) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal((purpose.label() + ":" + token).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (GeneralSecurityException generalSecurityException) {
            throw new IllegalStateException("HMAC 계산에 실패했습니다", generalSecurityException);
        }
    }
}
