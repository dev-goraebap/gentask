package dev.goraebap.refarch.module.user.domain;

import dev.goraebap.refarch.shared.domain.ValueObject;
import dev.goraebap.refarch.shared.error.DomainRuleViolation;
import java.util.ArrayList;
import java.util.List;

/**
 * 아직 해싱되지 않은 비밀번호. 규칙은 결정-0012 가 갖는다.
 *
 * <p>상한 72 는 bcrypt 가 그 뒤를 무시하는 데서 온다. 자르지 않고 거절하는 것은, 잘라 두면 73자를
 * 넣은 사람과 그 앞 72자를 넣은 사람이 같은 비밀번호를 갖게 되기 때문이다.
 *
 * <p>구성 규칙에는 반대 근거가 있다. NIST SP 800-63B 는 문자 종류의 조합을 요구하지 말 것을
 * 명시하며, 규칙을 걸면 그것을 최소 비용으로 충족하는 예측 가능한 형태로 몰린다고 본다. 그 대안인
 * 유출 목록 대조를 이 저장소가 아직 갖지 못해 규칙을 두는 쪽을 택했다.
 */
public record Password(String value) implements ValueObject {

    public static final int MIN = 8;
    public static final int MAX = 72;

    public static final String REQUIRED = "비밀번호를 입력해 주세요";
    public static final String LENGTH = "비밀번호는 " + MIN + "자 이상 " + MAX + "자 이하입니다";

    public static Password of(String rawPassword) {
        if (rawPassword == null || rawPassword.isEmpty()) {
            throw new DomainRuleViolation(REQUIRED);
        }
        // 앞뒤를 자르지 않는다. 자르면 사용자가 입력한 것과 저장된 것이 달라진다.
        if (rawPassword.length() < MIN || rawPassword.length() > MAX) {
            throw new DomainRuleViolation(LENGTH);
        }

        List<String> missing = new ArrayList<>();
        if (!contains(rawPassword, Character::isLetter)) {
            missing.add("영문자");
        }
        if (!contains(rawPassword, Character::isDigit)) {
            missing.add("숫자");
        }
        if (!contains(rawPassword, character -> !Character.isLetterOrDigit(character))) {
            missing.add("특수문자");
        }
        // 충족하지 못한 것을 모아 한 번에 낸다. 하나씩 알리면 고칠 때마다 다시 제출하게 된다.
        if (!missing.isEmpty()) {
            throw new DomainRuleViolation("비밀번호에 " + String.join(" · ", missing) + "를 각각 하나 이상 넣어 주세요");
        }
        return new Password(rawPassword);
    }

    private static boolean contains(String value, CharPredicate predicate) {
        return value.chars().anyMatch(codePoint -> predicate.test((char) codePoint));
    }

    /** 로그와 오류 메시지에 값이 실리지 않게 한다. */
    @Override
    public String toString() {
        return "Password(****)";
    }

    @FunctionalInterface
    private interface CharPredicate {
        boolean test(char character);
    }
}
