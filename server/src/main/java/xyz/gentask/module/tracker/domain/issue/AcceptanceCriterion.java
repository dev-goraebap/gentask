package xyz.gentask.module.tracker.domain.issue;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 인수 조건 하나.
 *
 * <p>표로 쪼개지 않고 본문 마크다운에서 읽는다. 본문을 그대로 옮기면 인수 조건이 함께 따라오는 것이
 * 이 선택의 값이다.
 *
 * <p><b>경계를 따로 표시하지 않는다.</b> {@code #n} 이 붙은 체크 항목 자체가 인수 조건이다. 예전에는
 * {@code <!-- AC:BEGIN -->} 주석이 그 자리를 갈랐으나, 화면의 편집기가 마크다운을 문서 모델로 바꿨다가
 * 되돌릴 때 HTML 주석을 담을 자리가 없어 통째로 버린다. 저장하는 순간 인수 조건이 사라지는 것보다
 * 번호로 가리는 편이 낫다.
 *
 * <p>번호는 부여 뒤 불변이며 지운 자리는 문장을 {@code (결번)} 으로 바꾸어 남긴다. 결번은 번호를 비워
 * 두기 위한 자리이며 검증 대상이 아니다.
 *
 * @param number 부여 뒤 바뀌지 않는 번호
 * @param sentence EARS 로 적은 문장
 * @param verified 확인되었는가
 * @param retired 결번인가
 */
public record AcceptanceCriterion(int number, String sentence, boolean verified, boolean retired) {

    private static final String RETIRED = "(결번)";

    private static final Pattern LINE = Pattern.compile("^- \\[([ x])] #(\\d+) (.+)$");

    /** 본문 어디에 있든 번호가 붙은 체크 항목을 모두 읽는다. */
    public static List<AcceptanceCriterion> readFrom(IssueBody body) {
        List<AcceptanceCriterion> criteria = new ArrayList<>();
        for (String each : body.value().replace("\r\n", "\n").split("\n")) {
            Matcher line = LINE.matcher(each.strip());
            if (!line.matches()) {
                continue;
            }
            String sentence = line.group(3).strip();
            criteria.add(new AcceptanceCriterion(
                    Integer.parseInt(line.group(2)), sentence, "x".equals(line.group(1)), RETIRED.equals(sentence)));
        }
        return List.copyOf(criteria);
    }

    /** 결번을 뺀 수. 목록이 내는 값이다. */
    public static int count(List<AcceptanceCriterion> criteria) {
        return (int) criteria.stream().filter(each -> !each.retired()).count();
    }

    /** 결번을 뺀 것 가운데 아직 확인되지 않은 수. */
    public static int unverifiedCount(List<AcceptanceCriterion> criteria) {
        return (int) criteria.stream()
                .filter(each -> !each.retired())
                .filter(each -> !each.verified())
                .count();
    }
}
