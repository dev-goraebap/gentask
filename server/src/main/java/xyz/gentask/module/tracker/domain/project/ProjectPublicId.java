package xyz.gentask.module.tracker.domain.project;

import java.security.SecureRandom;
import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * URL 경로에 사용되는 12자리 NanoID 기반 프로젝트 공개 식별자 값 객체다.
 */
public record ProjectPublicId(String value) implements ValueObject {

    public static final int LENGTH = 12;

    private static final String ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";

    private static final SecureRandom RANDOM = new SecureRandom();

    public static ProjectPublicId generate() {
        StringBuilder generated = new StringBuilder(LENGTH);
        for (int index = 0; index < LENGTH; index++) {
            generated.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return new ProjectPublicId(generated.toString());
    }

    public static ProjectPublicId of(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new DomainRuleViolation("프로젝트 식별자가 비어 있습니다");
        }
        String stripped = rawValue.strip();
        for (char each : stripped.toCharArray()) {
            if (ALPHABET.indexOf(each) < 0) {
                throw new DomainRuleViolation("프로젝트 식별자에 쓸 수 없는 글자가 있습니다");
            }
        }
        return new ProjectPublicId(stripped);
    }

    @Override
    public String toString() {
        return value;
    }
}
