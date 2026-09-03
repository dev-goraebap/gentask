package xyz.gentask.shared.mail;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * E2E 테스트 환경에서 발송된 인증 코드를 조회하기 위한 테스트 전용 지원 컴포넌트다.
 *
 * e2e 프로파일 활성화 시에만 등록되며, 실제 메일 발송 대신 메모리에 코드를 보관하고 조회 엔드포인트를 제공한다.
 */
@Profile("e2e")
@Configuration(proxyBeanMethods = false)
public class E2eMailSupport {

    /** 수신 주소별로 가장 최근 발송된 인증 코드를 보관한다. */
    public static class RecordingMailSender implements MailSender {

        private static final Pattern CODE = Pattern.compile("\\b(\\d{4,10})\\b");

        private final Map<String, String> lastBody = new ConcurrentHashMap<>();

        @Override
        public void send(String to, String subject, String body) {
            lastBody.put(to.toLowerCase(java.util.Locale.ROOT), body);
        }

        public Optional<String> lastCode(String to) {
            String body = lastBody.get(to.toLowerCase(java.util.Locale.ROOT));
            if (body == null) {
                return Optional.empty();
            }
            Matcher matcher = CODE.matcher(body);
            return matcher.find() ? Optional.of(matcher.group(1)) : Optional.empty();
        }
    }

    @Bean
    @Primary
    RecordingMailSender recordingMailSender() {
        return new RecordingMailSender();
    }

    /**
     * 중첩 클래스는 상위 클래스의 @Profile을 상속하지 않으므로 e2e 프로파일을 명시적으로 선언한다.
     */
    @Profile("e2e")
    @RestController
    @RequiredArgsConstructor
    public static class E2eMailController {

        private final RecordingMailSender recordingMailSender;

        @GetMapping("/e2e/last-code")
        public ResponseEntity<Map<String, String>> lastCode(@RequestParam String email) {
            return recordingMailSender
                    .lastCode(email)
                    .map(code -> ResponseEntity.ok(Map.of("code", code)))
                    .orElseGet(() -> ResponseEntity.notFound().build());
        }
    }
}
