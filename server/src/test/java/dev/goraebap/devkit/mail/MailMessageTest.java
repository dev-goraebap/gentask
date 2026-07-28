package dev.goraebap.devkit.mail;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MailMessageTest {

    @Test
    @DisplayName("MAIL-01 수신자 주소에 개행이 포함될 수 없다 — 헤더 인젝션 방지")
    void 수신자에_개행이_있으면_거부한다() {
        assertThatThrownBy(() -> new MailMessage("victim@example.com\r\nBcc: spam@example.com", "제목", "본문"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("MAIL-01 제목에 개행이 포함될 수 없다 — 헤더 인젝션 방지")
    void 제목에_개행이_있으면_거부한다() {
        assertThatThrownBy(() -> new MailMessage("user@example.com", "제목\nBcc: spam@example.com", "본문"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("MAIL-01 수신자는 이메일 형식이어야 하고 본문은 비어 있을 수 없다")
    void 형식을_검증한다() {
        assertThatThrownBy(() -> new MailMessage("not-an-email", "제목", "본문"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new MailMessage("user@example.com", "제목", " "))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatCode(() -> new MailMessage("user@example.com", "제목", "본문")).doesNotThrowAnyException();
    }
}
