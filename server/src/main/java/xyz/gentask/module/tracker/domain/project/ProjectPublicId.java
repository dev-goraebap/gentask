package xyz.gentask.module.tracker.domain.project;

import java.security.SecureRandom;
import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 프로젝트를 주소에서 가리키는 값.
 *
 * <p>사람이 정하지 않고 시스템이 만든다. 이름에서 뽑던 접두어가 그 일을 겸하고 있었으나, 접두어는
 * 이슈 이름(`GT-43`)에 박히는 것이라 짧고 읽혀야 하고 주소는 고유해야 한다. 한 값에 두 요구를
 * 걸면 한쪽이 진다.
 *
 * <p><b>전역으로 유일하다.</b> 주소에 소유자가 드러나지 않으므로 소유자 안에서만 유일하면 그 주소를
 * 건넸을 때 받는 사람의 다른 프로젝트가 열린다.
 *
 * <p>nanoid 의 알파벳을 쓰되 열두 자리로 줄인다. 스물한 자리의 기본값은 주소와 명령줄 인자를 길게
 * 만들고, 열둘이면 64^12(약 4.7 * 10^21)이라 이 규모에서 겹칠 자리가 없다.
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
