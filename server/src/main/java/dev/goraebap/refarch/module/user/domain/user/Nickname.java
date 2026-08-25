package dev.goraebap.refarch.module.user.domain.user;

import dev.goraebap.refarch.module.user.domain.Email;
import dev.goraebap.refarch.shared.domain.ValueObject;
import dev.goraebap.refarch.shared.error.DomainRuleViolation;

/** 화면이 부르는 이름 (TK-006). */
public record Nickname(String value) implements ValueObject {

    public static final int MAX = 30;
    public static final String REQUIRED = "별명을 입력해 주세요";

    /** 검증하고 정규화해 만든다. */
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

    /**
     * 가입에서 별명을 적지 않았을 때의 기본값이다. 이메일의 앞부분을 자른다.
     *
     * 빈 별명을 두지 않는 이유는 화면의 아바타와 사이드바가 이 값에서 이니셜을 만들기
     * 때문이다. 없음을 허용하면 그 자리마다 대체 문구가 필요해진다.
     */
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
