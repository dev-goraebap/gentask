package dev.goraebap.refarch;

import dev.goraebap.refarch.shared.storage.ObjectStorage;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * 보관소를 띄우지 않는 테스트용 구현. 키와 크기만 기억한다.
 *
 * presigned 절차에서 서버가 보는 것은 "그 키에 그 크기의 오브젝트가 있는가"뿐이므로,
 * 테스트는 put() 으로 올리기가 끝난 상태를 만든다.
 */
@TestConfiguration(proxyBeanMethods = false)
public class FakeStorageConfiguration {

    public static class FakeObjectStorage implements ObjectStorage {

        private final Map<String, Long> objects = new ConcurrentHashMap<>();

        /** 클라이언트가 presigned PUT 을 마친 상태를 흉내 낸다. */
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
