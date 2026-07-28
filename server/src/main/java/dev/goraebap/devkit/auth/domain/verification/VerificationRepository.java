package dev.goraebap.devkit.auth.domain.verification;

import java.util.Optional;
import java.util.UUID;

/**
 * 대기 레코드 저장소. 조회가 식별자 + 용도를 함께 받는 것은 실수 방지가 아니라 계약이다 —
 * 용도 필터 없는 조회 경로를 인터페이스 수준에서 없앤다 (결정-0015 §결정 8).
 */
public interface VerificationRepository {

    void save(Verification verification);

    Optional<Verification> findByIdAndPurpose(UUID id, VerificationPurpose purpose);

    /**
     * 검증 시도를 위해 <b>행을 잠그고</b> 조회한다.
     *
     * <p>시도 횟수 제한은 읽고-증가시키고-쓰는 순서에 의존하므로, 잠금 없이 하면 동시 요청들이
     * 서로의 증가분을 덮어써(lost update) 5회 제한이 무력화된다. 그러면 공격자가 같은 대기
     * 레코드에 코드를 병렬로 대입해 10⁶ 공간을 전수 탐색할 수 있고, 소유하지 않은 이메일로
     * 계정을 얻는다 — 결정-0015의 핵심 불변식이 무너진다.
     *
     * <p>반드시 트랜잭션 안에서 호출해야 하며, 검증 결과와 무관하게 저장해야 시도가 누적된다.
     */
    Optional<Verification> findForAttempt(UUID id, VerificationPurpose purpose);
}
