package dev.goraebap.devkit.auth.domain.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class EmailAddressTest {

    @Test
    @DisplayName("AUTH-01 이메일 동일성 판정은 소문자화 + 앞뒤 공백 제거만 한다 (결정-0015)")
    void 소문자화와_공백제거만_한다() {
        EmailAddress email = EmailAddress.of("  Alice@Example.COM  ");

        assertThat(email.raw()).isEqualTo("Alice@Example.COM");
        assertThat(email.normalized()).isEqualTo("alice@example.com");
    }

    @Test
    @DisplayName("AUTH-01 점 제거·플러스 태그 제거는 하지 않는다 — 제거하면 남의 주소로 가입되는 사고가 난다 (결정-0015)")
    void 점과_플러스_태그를_보존한다() {
        EmailAddress email = EmailAddress.of("a.li.ce+tag@example.com");

        assertThat(email.normalized()).isEqualTo("a.li.ce+tag@example.com");
    }

    @Test
    @DisplayName("AUTH-01 형식이 올바르지 않은 이메일은 거부한다")
    void 형식이_틀리면_거부한다() {
        assertThatThrownBy(() -> EmailAddress.of(null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> EmailAddress.of("   ")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> EmailAddress.of("no-at-sign")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> EmailAddress.of("two@@example.com")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> EmailAddress.of("spa ce@example.com")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> EmailAddress.of("no-domain@")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("AUTH-01 RFC 상한 320자를 넘으면 거부한다")
    void 길이_상한을_넘으면_거부한다() {
        String tooLong = "a".repeat(310) + "@example.com";

        assertThatThrownBy(() -> EmailAddress.of(tooLong)).isInstanceOf(IllegalArgumentException.class);
    }
}
