package dev.goraebap.devkit.auth.application.sociallogin;

import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import java.time.Instant;

/**
 * 제공자 인증은 끝났지만 이메일 소유는 아직 증명되지 않은 중간 상태 (AUTH-02·03).
 *
 * <p>이 상태를 <b>DB에 두지 않는 이유</b>: 대기 레코드({@code verifications})는 이메일이 정해져야
 * 만들 수 있는데, 이 시점에는 사용자가 아직 이메일을 입력하지 않았다. 그렇다고 이메일 없이
 * 만들 수 있게 스키마를 열면 "가입 대기는 이메일을 향한다"는 성질이 흐려진다.
 *
 * <p>대신 <b>서명된 짧은 표</b>로 만들어 클라이언트가 들고 있게 한다. 위조하면 서명 검증에서
 * 걸리고, 훔쳐도 이메일 소유 증명(OTP)을 통과하지 못하면 계정이 생기지 않는다. 즉 이 표는
 * <b>자격증명이 아니라 이어달리기 배턴</b>이다.
 *
 * <p>제공자가 준 토큰은 이 표에 담지 않는다 — 담으면 암호문이라도 클라이언트로 나가고,
 * 애초에 우리는 제공자 API를 호출하지 않아 보관할 이유가 없다(인증.md AUTH-02·03 참조).
 */
public record PendingSocialTicket(AuthProvider provider, String providerAccountId, Instant expiresAt) {

    public boolean isExpired(Instant now) {
        return !now.isBefore(expiresAt);
    }
}
