package xyz.gentask.module.file;

/**
 * 첨부가 놓이는 자리. {@code (owner_type, name)} 쌍 하나가 자리 하나이며 그 자리의 정책을 함께 갖는다.
 *
 * <p>공개 언어(Published Language)다. 첨부를 붙이는 모듈은 이 열거의 값 하나를 고르는 것으로 어디에
 * 무엇을 붙일지 지목한다.
 *
 * <p>개수와 크기를 표 제약으로 적을 수 없어 여기에 둔다. 하나만 허용하는 자리와 여럿을 허용하는 자리가
 * 같은 표에 살기 때문이며, 강제는 애플리케이션이 수행한다.
 */
public enum AttachmentSlot {

    /** 작업에 붙인 파일. 종류를 가리지 않는다. */
    TASK_FILES("TASK", "files", "tasks", 5, 10L * 1024 * 1024, null),

    /** 프로필 이미지. 자리 하나뿐이며 새로 올리면 앞의 것을 밀어낸다. */
    USER_PROFILE_IMAGE("USER", "profile_image", "users", 1, 1L * 1024 * 1024, "image/");

    private final String ownerType;
    private final String name;
    private final String storagePrefix;
    private final int maxCount;
    private final long maxBytes;
    private final String requiredContentTypePrefix;

    AttachmentSlot(
            String ownerType,
            String name,
            String storagePrefix,
            int maxCount,
            long maxBytes,
            String requiredContentTypePrefix) {
        this.ownerType = ownerType;
        this.name = name;
        this.storagePrefix = storagePrefix;
        this.maxCount = maxCount;
        this.maxBytes = maxBytes;
        this.requiredContentTypePrefix = requiredContentTypePrefix;
    }

    /** {@code attachments.owner_type} 에 저장되는 값. 붙은 레코드의 종류다. */
    public String ownerType() {
        return ownerType;
    }

    /** {@code attachments.name} 에 저장되는 값. 같은 레코드에 붙는 첨부의 용도를 가른다. */
    public String attachmentName() {
        return name;
    }

    /** 보관소 키의 접두어 — {@code <prefix>/<yyyy>/<MM>/<blobId>}. */
    public String storagePrefix() {
        return storagePrefix;
    }

    public int maxCount() {
        return maxCount;
    }

    public long maxBytes() {
        return maxBytes;
    }

    /** 자리 하나만 허용하면 새 첨부가 앞의 것을 밀어낸다. */
    public boolean isSingle() {
        return maxCount == 1;
    }

    public boolean accepts(String contentType) {
        return requiredContentTypePrefix == null
                || (contentType != null && contentType.startsWith(requiredContentTypePrefix));
    }
}
