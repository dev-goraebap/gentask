package dev.goraebap.devkit.auth.domain.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AccountTest {

    private static final Instant NOW = Instant.parse("2026-07-28T09:00:00Z");

    @Test
    @DisplayName("AUTH-06 credential 계정에는 비밀번호 해시가 있어야 한다")
    void credential_계정에는_비밀번호가_있어야_한다() {
        UUID userId = UUID.randomUUID();

        assertThatThrownBy(() -> Account.credential(UUID.randomUUID(), userId, null, NOW))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Account.credential(UUID.randomUUID(), userId, " ", NOW))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("AUTH-06 비밀번호는 credential 계정에만 실린다")
    void 소셜_계정에_비밀번호가_실리면_거부한다() {
        assertThatThrownBy(() -> Account.restore(
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        AuthProvider.GOOGLE,
                        "google-subject",
                        "$2a$10$hash",
                        NOW,
                        NOW))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("AUTH-07 credential 계정의 비밀번호는 교체할 수 있다")
    void 비밀번호를_교체한다() {
        Account account = Account.credential(UUID.randomUUID(), UUID.randomUUID(), "$2a$10$old", NOW);
        Instant later = NOW.plusSeconds(60);

        account.changePassword("$2a$10$new", later);

        assertThat(account.passwordHash()).isEqualTo("$2a$10$new");
        assertThat(account.updatedAt()).isEqualTo(later);
    }

    @Test
    @DisplayName("AUTH-07 소셜 계정에는 비밀번호를 설정할 수 없다")
    void 소셜_계정은_비밀번호를_가질_수_없다() {
        Account social = Account.restore(
                UUID.randomUUID(), UUID.randomUUID(), AuthProvider.GOOGLE, "google-subject", null, NOW, NOW);

        assertThatThrownBy(() -> social.changePassword("$2a$10$new", NOW)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("AUTH-06 credential의 제공자 식별자는 사용자 id의 문자열이다")
    void credential의_제공자_식별자는_사용자_id다() {
        UUID userId = UUID.randomUUID();

        Account account = Account.credential(UUID.randomUUID(), userId, "$2a$10$hash", NOW);

        assertThat(account.provider()).isEqualTo(AuthProvider.CREDENTIAL);
        assertThat(account.providerAccountId()).isEqualTo(userId.toString());
    }
}
