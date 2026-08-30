package dev.goraebap.refarch;

import dev.goraebap.refarch.shared.mail.E2eMailSupport.RecordingMailSender;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * 실제로 나가는 SMTP 를 덮는다.
 *
 * <p>종단 테스트가 쓰는 것과 같은 구현을 쓴다. 보낸 것을 담아 두는 일이 두 자리에서 같으므로 두 벌을
 * 두지 않는다.
 */
@TestConfiguration(proxyBeanMethods = false)
public class FakeMailConfiguration {

    @Bean
    @Primary
    RecordingMailSender fakeMailSender() {
        return new RecordingMailSender();
    }
}
