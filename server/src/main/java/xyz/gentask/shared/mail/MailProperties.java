package xyz.gentask.shared.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 발신자 메일 주소 및 표시 이름 설정 프로퍼티다.
 */
@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(String from, String fromName) {}
