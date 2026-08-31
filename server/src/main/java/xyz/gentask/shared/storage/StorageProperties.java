package xyz.gentask.shared.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storage")
public record StorageProperties(
        String endpoint, String region, String accessKey, String secretKey, String bucket, boolean createBucket) {}
