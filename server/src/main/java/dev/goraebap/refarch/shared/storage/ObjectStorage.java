package dev.goraebap.refarch.shared.storage;

import java.time.Duration;
import java.util.Optional;

/**
 * 파일 보관소. 백엔드는 URL 만 주고 바이트는 클라이언트가 보관소와 직접 주고받는다.
 *
 * 도메인을 모르는 공용 기반이다. 키의 구조와 개수 · 크기 제한은 쓰는 모듈이 정한다.
 */
public interface ObjectStorage {

    /** 올리기용 presigned PUT URL. 서명에 Content-Type 이 들어가므로 클라이언트도 같은 값을 보내야 한다. */
    String presignPut(String objectKey, String contentType, Duration expiry);

    /**
     * 받기용 presigned GET URL.
     *
     * downloadFileName 을 주면 내려받기(attachment)로, null 이면 표시용(인라인)으로 서명한다.
     * 첨부 파일은 전자, 아바타처럼 화면에 그리는 것은 후자다.
     */
    String presignGet(String objectKey, String downloadFileName, Duration expiry);

    /** 보관소의 실제 크기다. 확정 시점의 검증이 클라이언트가 말한 크기 대신 이 값을 믿는다. */
    Optional<Long> sizeOf(String objectKey);

    void delete(String objectKey);
}
