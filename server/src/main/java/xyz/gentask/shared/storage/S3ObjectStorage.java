package xyz.gentask.shared.storage;

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

@Slf4j
@Component
class S3ObjectStorage implements ObjectStorage {

    private final StorageProperties properties;
    private final String keyPrefix;
    private final S3Client s3Client;
    private final S3Presigner presigner;

    S3ObjectStorage(StorageProperties properties) {
        this.properties = properties;
        this.keyPrefix = properties.normalizedKeyPrefix();
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
                .key(resolve(objectKey))
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
                GetObjectRequest.builder().bucket(properties.bucket()).key(resolve(objectKey));
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
                            .key(resolve(objectKey))
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
                .key(resolve(objectKey))
                .build());
    }

    /** 환경별 접두어를 붙인다. 데이터베이스가 보관하는 키는 접두어를 포함하지 않는다. */
    private String resolve(String objectKey) {
        return keyPrefix + objectKey;
    }

    private static String contentDisposition(String downloadFileName) {
        String encoded =
                URLEncoder.encode(downloadFileName, StandardCharsets.UTF_8).replace("+", "%20");
        return "attachment; filename*=UTF-8''" + encoded;
    }
}
