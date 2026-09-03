package xyz.gentask.module.user.domain;

import java.util.ArrayList;
import java.util.List;
import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

/**
 * 미해싱 평문 비밀번호 값 객체다(결정-0012).
 *
 * bcrypt 알고리즘의 유효 자릿수 한계(72자)를 고려하여 8자 이상 72자 이하로 길이를 제한한다.
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
        // 사용자 입력을 보존하기 위해 앞뒤 공백을 임의로 제거하지 않는다.
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
        // 정책 미충족 항목들을 모두 수집하여 일괄 반환한다.
        if (!missing.isEmpty()) {
            throw new DomainRuleViolation("비밀번호에 " + String.join(" · ", missing) + "를 각각 하나 이상 넣어 주세요");
        }
        return new Password(rawPassword);
    }

    private static boolean contains(String value, CharPredicate predicate) {
        return value.chars().anyMatch(codePoint -> predicate.test((char) codePoint));
    }

    /** 로그 및 오류 메시지에서 평문이 노출되지 않도록 마스킹 처리한다. */
    @Override
    public String toString() {
        return "Password(****)";
    }

    @FunctionalInterface
    private interface CharPredicate {
        boolean test(char character);
    }
}
