package dev.goraebap.refarch.shared.mail;

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
 * 종단 테스트가 코드를 읽을 수 있게 하는 자리.
 *
 * <p>브라우저는 메일함을 열지 못하므로 코드를 알 방법이 없고, 그것 없이는 가입과 재설정의 어느
 * 인수 조건도 화면에서 지날 수 없다. 실제로 보내는 대신 메모리에 담고 그것을 꺼내는 경로를 둔다.
 *
 * <p>{@code e2e} 프로파일에서만 선다. 배포는 프로파일을 지정하지 않으므로 운영에는 이 빈도 경로도
 * 없다. 경로를 {@code /api} 밖에 두어 인증 인터셉터의 예외 목록을 건드리지 않는다 — 그 목록은
 * 운영 규격이고, 거기에 시험용 자리를 더하면 운영에서 열린 자리가 하나 늘어난다.
 */
@Profile("e2e")
@Configuration(proxyBeanMethods = false)
public class E2eMailSupport {

    /** 마지막으로 보낸 것을 주소마다 하나씩 든다. 다시 요청하면 앞의 것이 갈린다. */
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
     * 중첩 클래스는 바깥의 {@code @Profile} 을 물려받지 않고 따로 스캔된다. 여기 직접 달지 않으면
     * 운영에서도 이 자리가 서고, 그러면 남의 코드를 꺼내는 경로가 열린다.
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
