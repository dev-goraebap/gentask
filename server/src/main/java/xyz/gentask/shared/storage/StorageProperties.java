package xyz.gentask.shared.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storage")
public record StorageProperties(
        String endpoint,
        String region,
        String accessKey,
        String secretKey,
        String bucket,
        boolean createBucket,
        String keyPrefix) {

    /** 접두어를 `qa/` 형태로 맞춘다. 빈 값이면 버킷 루트를 그대로 쓴다. */
    public String normalizedKeyPrefix() {
        if (keyPrefix == null || keyPrefix.isBlank()) {
            return "";
        }
        String trimmed = keyPrefix.strip().replaceAll("^/+", "").replaceAll("/+$", "");
        return trimmed.isEmpty() ? "" : trimmed + "/";
    }
}
