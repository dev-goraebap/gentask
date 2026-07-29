package dev.goraebap.devkit.auth.application.sociallogin;

import static org.assertj.core.api.Assertions.assertThat;

import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import dev.goraebap.devkit.auth.support.AuthTestFixtures;
import dev.goraebap.devkit.auth.support.FakeCrypto;
import dev.goraebap.devkit.auth.support.MutableClock;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PendingSocialTicketCodecTest {

    private MutableClock clock;
    private PendingSocialTicketCodec codec;

    @BeforeEach
    void 초기화() {
        clock = AuthTestFixtures.clock();
        codec = new PendingSocialTicketCodec(FakeCrypto.tokenHasher(), clock);
    }

    @Test
    @DisplayName("AUTH-02 표를 만들고 되돌리면 같은 제공자 신원이 나온다")
    void 왕복한다() {
        String ticket = codec.encode(AuthProvider.GOOGLE, "google-subject-1");

        assertThat(codec.decode(ticket)).hasValueSatisfying(decoded -> {
            assertThat(decoded.provider()).isEqualTo(AuthProvider.GOOGLE);
            assertThat(decoded.providerAccountId()).isEqualTo("google-subject-1");
        });
    }

    @Test
    @DisplayName("AUTH-02 내용을 고치면 서명이 맞지 않아 거부된다 — 남의 제공자 계정인 척할 수 없다")
    void 위조를_거부한다() {
        String ticket = codec.encode(AuthProvider.GOOGLE, "victim-subject");
        String forged = codec.encode(AuthProvider.GOOGLE, "attacker-subject");

        // 공격자가 자기 표의 앞부분만 피해자 것으로 바꿔치기한다
        String payloadOfVictim = ticket.substring(0, ticket.lastIndexOf('.'));
        String signatureOfAttacker = forged.substring(forged.lastIndexOf('.') + 1);

        assertThat(codec.decode(payloadOfVictim + "." + signatureOfAttacker)).isEmpty();
    }

    @Test
    @DisplayName("AUTH-02 표는 10분이면 만료된다 — 제공자 인증 한 번을 오래 우려먹을 수 없다")
    void 만료된_표를_거부한다() {
        String ticket = codec.encode(AuthProvider.KAKAO, "kakao-1");
        clock.advance(PendingSocialTicketCodec.TTL.plus(Duration.ofSeconds(1)));

        assertThat(codec.decode(ticket)).isEmpty();
    }

    @Test
    @DisplayName("AUTH-02 형식이 깨진 표는 조용히 거부된다 — 사유를 구분해 알려주지 않는다")
    void 깨진_표를_거부한다() {
        assertThat(codec.decode(null)).isEmpty();
        assertThat(codec.decode("")).isEmpty();
        assertThat(codec.decode("서명없음")).isEmpty();
        assertThat(codec.decode(".only-signature")).isEmpty();
        assertThat(codec.decode("not-base64.deadbeef")).isEmpty();
    }
}
