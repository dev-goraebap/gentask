package dev.goraebap.devkit.mail.infrastructure.smtp;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 발신자 설정. Gmail SMTP는 발신자가 계정 주소로 고정된다 (결정-0016 §결과) — 기본값은
 * {@code spring.mail.username}을 따라간다.
 */
@ConfigurationProperties(prefix = "mail")
public record MailFromProperties(String from) {}
