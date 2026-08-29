package dev.goraebap.refarch.module.user.application;

import java.util.Locale;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 첫 관리자를 가리키는 설정.
 *
 * <p>관리자는 이미 관리자인 사람이 올려서만 되는데, 그러면 첫 사람이 생기지 않는다. 그 자리를 설정값
 * 하나로 연다. 화면이나 API 로는 열지 않으므로 서버 설정에 닿을 수 있는 사람만 첫 관리자를 정한다.
 *
 * @param email 관리자로 둘 계정의 이메일. 비어 있으면 아무도 올리지 않는다
 */
@ConfigurationProperties(prefix = "app.admin")
public record AdminProperties(String email) {

    /** 정규화된 이메일이 이 설정이 가리키는 것인가. */
    public boolean designates(String normalizedEmail) {
        return email != null
                && !email.isBlank()
                && email.strip().toLowerCase(Locale.ROOT).equals(normalizedEmail);
    }
}
