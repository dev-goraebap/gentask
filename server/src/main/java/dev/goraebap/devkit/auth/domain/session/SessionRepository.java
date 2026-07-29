package dev.goraebap.devkit.auth.domain.session;

import java.util.Optional;
import java.util.UUID;

/** 세션 저장소. 무효화는 행 삭제다 — 소프트 삭제를 두지 않는다 (결정-0014). */
public interface SessionRepository {

    void save(Session session);

    Optional<Session> findByTokenHash(String tokenHash);

    void deleteById(UUID id);

    /**
     * 그 세션이 <b>해당 사용자의 것일 때만</b> 지운다 (AUTH-06 개별 무효화).
     *
     * <p>조회 후 검증하는 대신 조건을 삭제문에 함께 넣는다 — 남의 세션 식별자를 넣어 지우는
     * 경로를 애플리케이션 분기가 아니라 SQL 한 문장으로 닫는다.
     *
     * @return 지웠으면 true. 없거나 남의 것이면 false — 둘을 구분해 응답하지 않는다(존재 노출 방지)
     */
    boolean deleteByIdAndUserId(UUID id, UUID userId);

    void deleteAllByUserId(UUID userId);
}
