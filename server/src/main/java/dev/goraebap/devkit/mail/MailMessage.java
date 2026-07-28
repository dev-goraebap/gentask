package dev.goraebap.devkit.mail;

import java.util.regex.Pattern;

/**
 * 발송할 메일 한 통 (MAIL-01).
 *
 * <p>생성 시점에 헤더 인젝션을 차단한다 — 수신자·제목에 개행(CR/LF)이 포함될 수 없다. 본문은
 * 호출자가 템플릿으로 조립하며, 사용자 입력을 그대로 싣지 않는 책임은 호출자에게 있다.
 */
public record MailMessage(String to, String subject, String text) {

    private static final Pattern CRLF = Pattern.compile("[\\r\\n]");
    private static final Pattern SIMPLE_EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    public MailMessage {
        if (to == null || !SIMPLE_EMAIL.matcher(to).matches()) {
            throw new IllegalArgumentException("수신자 주소가 올바르지 않습니다");
        }
        if (subject == null || subject.isBlank() || CRLF.matcher(subject).find()) {
            throw new IllegalArgumentException("제목이 비어 있거나 개행을 포함합니다");
        }
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("본문이 비어 있습니다");
        }
    }
}
