package dev.goraebap.devkit.auth.domain.account;

import java.util.Optional;
import java.util.UUID;

/** 인증 수단 저장소. 구현은 infrastructure/repository. */
public interface AccountRepository {

    void save(Account account);

    Optional<Account> findByUserIdAndProvider(UUID userId, AuthProvider provider);

    /**
     * 행을 잠그고 읽는다 — 비밀번호를 읽는 경로와 바꾸는 경로가 같은 행에서 줄을 서게 한다
     * (검토 #32-1).
     *
     * <p><b>잠그지 않으면</b> READ COMMITTED에서 이런 일이 생긴다. 재설정 트랜잭션이 커밋되기
     * 직전에 시작된 로그인 트랜잭션은 <b>옛 비밀번호 해시를 읽어</b> 검증을 통과하고, 재설정이
     * 세션을 모두 지운 <b>뒤에</b> 자기 세션을 넣는다. 그 세션은 삭제 대상에 없었으므로 재설정
     * 후에도 살아남는다 — 옛 비밀번호를 아는 공격자가 재설정 순간에 로그인을 연타하면 성립한다.
     *
     * <p>두 경로가 같은 행을 잠그면 로그인은 재설정이 끝날 때까지 기다렸다가 <b>새 해시를 다시
     * 읽어</b> 검증에 실패한다.
     */
    Optional<Account> findByUserIdAndProviderForUpdate(UUID userId, AuthProvider provider);

    Optional<Account> findByProviderAndProviderAccountId(AuthProvider provider, String providerAccountId);
}
