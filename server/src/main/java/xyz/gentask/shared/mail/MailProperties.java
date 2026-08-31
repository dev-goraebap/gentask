package xyz.gentask.shared.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 보내는 쪽의 표기.
 *
 * <p>접속 정보(호스트 · 포트 · 자격)는 Spring 의 {@code spring.mail.*} 이 갖고, 여기는 받는
 * 사람에게 보이는 값만 든다.
 */
@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(String from, String fromName) {}
