package dev.goraebap.refarch.shared.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 보관소 접속 정보. 기본값은 compose.yaml 의 MinIO 이고 R2 로 갈 때 환경변수로 바꾼다.
 *
 * endpoint 는 브라우저에서 닿는 주소여야 한다. presigned URL 의 호스트가 이 값에서 나온다.
 */
@ConfigurationProperties(prefix = "storage")
public record StorageProperties(
        String endpoint, String region, String accessKey, String secretKey, String bucket, boolean createBucket) {}
