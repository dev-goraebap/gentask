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

    @Test
    @DisplayName("AUTH-02 제공자 식별자에 구분자가 들어 있어도 원래 값 그대로 복원된다 (보안 검토 F6)")
    void 구분자가_든_식별자를_잃지_않는다() {
        // 구글 sub·카카오 id는 숫자라 지금은 걸리지 않는다. 다만 이 키트는 파생 프로젝트가
        // 제공자를 추가할 것을 전제하며(결정-0015), 문자열 식별자를 주는 제공자를 붙이면
        // 자유 형식 필드가 가운데 있던 옛 배치에서는 만료시각 파싱이 깨져 표가 원인 불명으로
        // 거부됐다. 실패 사유를 구분하지 않는 설계라 디버깅이 특히 어려운 종류의 결함이다.
        String identifierWithSeparator = "tenant|user|42";

        String ticket = codec.encode(AuthProvider.GOOGLE, identifierWithSeparator);

        assertThat(codec.decode(ticket)).hasValueSatisfying(표 -> {
            assertThat(표.providerAccountId()).isEqualTo(identifierWithSeparator);
            assertThat(표.provider()).isEqualTo(AuthProvider.GOOGLE);
            assertThat(표.isExpired(clock.instant())).isFalse();
        });
    }

    @Test
    @DisplayName("AUTH-02 빈 제공자 식별자도 만료시각과 섞이지 않는다")
    void 빈_식별자도_경계를_지킨다() {
        String ticket = codec.encode(AuthProvider.KAKAO, "");

        assertThat(codec.decode(ticket))
                .hasValueSatisfying(표 -> assertThat(표.providerAccountId()).isEmpty());
    }
}
