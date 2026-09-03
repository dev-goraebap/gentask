package xyz.gentask.module.tracker.domain.doc;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 문서 본문 값 객체다. 마크다운 자유 서식을 지원하며 최대 100,000자로 제한한다.
 *
 * 내용 변경 여부를 신속히 비교하기 위해 본문의 SHA-1 해시를 계산하여 제공한다(DOC-003 A2).
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

    /** 본문의 SHA-1 해시를 소문자 40자리 16진수 문자열로 반환한다. */
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
