package xyz.gentask;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import xyz.gentask.shared.mail.E2eMailSupport.RecordingMailSender;

/**
 * 실제 SMTP 발송을 대체한다.
 *
 * 종단 테스트와 같은 구현을 사용한다. 발송 내역을 보관하는 동작이 두 곳에서 동일하므로 구현을
 * 이중으로 두지 않는다.
 */
@TestConfiguration(proxyBeanMethods = false)
public class FakeMailConfiguration {

    @Bean
    @Primary
    RecordingMailSender fakeMailSender() {
        return new RecordingMailSender();
    }
}
