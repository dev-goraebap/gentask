package xyz.gentask.module.user.domain.user;

import xyz.gentask.module.user.domain.Email;
import xyz.gentask.shared.domain.ValueObject;
import xyz.gentask.shared.error.DomainRuleViolation;

public record Nickname(String value) implements ValueObject {

    public static final int MAX = 30;
    public static final String REQUIRED = "별명을 입력해 주세요";

    public static Nickname of(String rawNickname) {
        if (rawNickname == null || rawNickname.isBlank()) {
            throw new DomainRuleViolation(REQUIRED);
        }
        String strippedNickname = rawNickname.strip();
        if (strippedNickname.length() > MAX) {
            throw new DomainRuleViolation("별명은 " + MAX + "자를 넘을 수 없습니다");
        }
        return new Nickname(strippedNickname);
    }

    public static Nickname fromEmail(Email email) {
        String localPart = email.value().substring(0, email.value().indexOf('@'));
        String trimmedPart = localPart.length() > MAX ? localPart.substring(0, MAX) : localPart;
        return new Nickname(trimmedPart);
    }

    @Override
    public String toString() {
        return value;
    }
}
