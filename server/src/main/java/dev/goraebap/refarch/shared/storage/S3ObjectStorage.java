package dev.goraebap.refarch.shared.storage;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

/**
 * S3 호환 보관소 구현. 로컬은 MinIO, 배포는 R2 다.
 *
 * path-style 을 쓰는 이유는 MinIO 가 가상 호스트 방식을 기본으로 지원하지 않아서다.
 * R2 도 path-style 을 받으므로 갈아 끼울 때 코드가 갈리지 않는다.
 */
@Slf4j
@Component
class S3ObjectStorage implements ObjectStorage {

    private final StorageProperties properties;
    private final S3Client s3Client;
    private final S3Presigner presigner;

    S3ObjectStorage(StorageProperties properties) {
        this.properties = properties;
        AwsBasicCredentials credentials = AwsBasicCredentials.create(properties.accessKey(), properties.secretKey());
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(properties.endpoint()))
                .region(Region.of(properties.region()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .forcePathStyle(true)
                .build();
        this.presigner = S3Presigner.builder()
                .endpointOverride(URI.create(properties.endpoint()))
                .region(Region.of(properties.region()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .serviceConfiguration(software.amazon.awssdk.services.s3.S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }

    /**
     * MinIO 는 버킷을 만들어 주지 않아 기동 때 시도한다. 실패해도 기동을 막지 않는다 —
     * 보관소 없이도 나머지 기능은 성립하고, 테스트는 보관소를 띄우지 않는다.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void ensureBucket() {
        if (!properties.createBucket()) {
            return;
        }
        try {
            s3Client.headBucket(
                    HeadBucketRequest.builder().bucket(properties.bucket()).build());
        } catch (NoSuchBucketException noSuchBucket) {
            s3Client.createBucket(
                    CreateBucketRequest.builder().bucket(properties.bucket()).build());
            log.info("버킷을 만들었습니다: {}", properties.bucket());
        } catch (SdkException sdkException) {
            log.warn("보관소에 닿지 못했습니다. 파일 기능이 동작하지 않습니다: {}", sdkException.getMessage());
        }
    }

    @Override
    public String presignPut(String objectKey, String contentType, Duration expiry) {
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(properties.bucket())
                .key(objectKey)
                .contentType(contentType)
                .build();
        return presigner
                .presignPutObject(PutObjectPresignRequest.builder()
                        .signatureDuration(expiry)
                        .putObjectRequest(putRequest)
                        .build())
                .url()
                .toString();
    }

    @Override
    public String presignGet(String objectKey, String downloadFileName, Duration expiry) {
        GetObjectRequest.Builder getRequestBuilder =
                GetObjectRequest.builder().bucket(properties.bucket()).key(objectKey);
        if (downloadFileName != null) {
            getRequestBuilder.responseContentDisposition(contentDisposition(downloadFileName));
        }
        GetObjectRequest getRequest = getRequestBuilder.build();
        return presigner
                .presignGetObject(GetObjectPresignRequest.builder()
                        .signatureDuration(expiry)
                        .getObjectRequest(getRequest)
                        .build())
                .url()
                .toString();
    }

    @Override
    public Optional<Long> sizeOf(String objectKey) {
        try {
            return Optional.of(s3Client.headObject(HeadObjectRequest.builder()
                            .bucket(properties.bucket())
                            .key(objectKey)
                            .build())
                    .contentLength());
        } catch (NoSuchKeyException noSuchKey) {
            return Optional.empty();
        }
    }

    @Override
    public void delete(String objectKey) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(properties.bucket())
                .key(objectKey)
                .build());
    }

    /** 파일 이름은 임의 입력이라 RFC 5987 로 인코딩한다. 그대로 실으면 헤더가 깨진다. */
    private static String contentDisposition(String downloadFileName) {
        String encoded =
                URLEncoder.encode(downloadFileName, StandardCharsets.UTF_8).replace("+", "%20");
        return "attachment; filename*=UTF-8''" + encoded;
    }
}
