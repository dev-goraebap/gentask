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
}
