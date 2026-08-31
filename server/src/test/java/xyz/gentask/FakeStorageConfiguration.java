package xyz.gentask;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import xyz.gentask.shared.storage.ObjectStorage;

@TestConfiguration(proxyBeanMethods = false)
public class FakeStorageConfiguration {

    public static class FakeObjectStorage implements ObjectStorage {

        private final Map<String, Long> objects = new ConcurrentHashMap<>();

        public void put(String objectKey, long size) {
            objects.put(objectKey, size);
        }

        public boolean contains(String objectKey) {
            return objects.containsKey(objectKey);
        }

        @Override
        public String presignPut(String objectKey, String contentType, Duration expiry) {
            return "http://fake-storage/put/" + objectKey;
        }

        @Override
        public String presignGet(String objectKey, String downloadFileName, Duration expiry) {
            return "http://fake-storage/get/" + objectKey;
        }

        @Override
        public Optional<Long> sizeOf(String objectKey) {
            return Optional.ofNullable(objects.get(objectKey));
        }

        @Override
        public void delete(String objectKey) {
            objects.remove(objectKey);
        }
    }

    @Bean
    @Primary
    FakeObjectStorage fakeObjectStorage() {
        return new FakeObjectStorage();
    }
}
