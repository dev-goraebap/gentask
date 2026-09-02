package xyz.gentask.module.tracker.domain.doc;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 문서 본문. 마크다운 자유 서술이다.
 *
 * <p>상한이 작업 아이템의 것(20,000)보다 훨씬 크다. 문서는 한 주제를 끝까지 적는 자리이고, 이
 * 저장소의 가장 긴 문서가 21,238 자라 작업 아이템의 상한을 그대로 쓰면 지금 있는 문서 하나가 이미
 * 들어가지 못한다.
 *
 * <p>본문의 SHA-1 을 이 값이 낸다. 달라지지 않은 저장이 개정을 만들지 않게 하는 자리이며, 견주는
 * 규칙이 본문 자체의 성질이므로 여기에 둔다(DOC-003 A2).
 */
public record DocumentBody(String value) implements ValueObject {

    public static final int MAX = 100_000;

    private static final DocumentBody EMPTY = new DocumentBody("");

    public static DocumentBody empty() {
        return EMPTY;
    }

    public static DocumentBody of(String rawBody) {
        if (rawBody == null) {
            return EMPTY;
        }
        if (rawBody.length() > MAX) {
            throw new DomainRuleViolation("본문은 " + MAX + "자를 넘을 수 없습니다");
        }
        return new DocumentBody(rawBody);
    }

    /** 본문의 SHA-1. 소문자 16진수 마흔 자다. */
    public String sha1() {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-1");
            return HexFormat.of().formatHex(messageDigest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException noSuchAlgorithmException) {
            throw new IllegalStateException("SHA-1 이 없는 런타임이다", noSuchAlgorithmException);
        }
    }

    @Override
    public String toString() {
        return value;
    }
}
