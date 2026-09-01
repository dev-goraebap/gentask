package xyz.gentask.module.tracker.domain.issue;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 인수 조건 하나.
 *
 * <p>표로 쪼개지 않고 본문 마크다운에서 읽는다. {@code backlog/} 가 쓰던 관례를 그대로 쓰며, 본문을
 * 그대로 옮기면 인수 조건이 함께 따라오는 것이 이 선택의 값이다.
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

    /** 도구가 심는 마커. 절 제목에 기대지 않는 것은 문체를 다듬어도 판정이 유지되어야 하기 때문이다. */
    private static final Pattern BLOCK = Pattern.compile("<!-- AC:BEGIN -->\\n([\\s\\S]*?)<!-- AC:END -->");

    private static final Pattern LINE = Pattern.compile("^- \\[([ x])] #(\\d+) (.+)$");

    /** 본문에서 인수 조건을 읽는다. 마커가 없으면 빈 목록이다. */
    public static List<AcceptanceCriterion> readFrom(IssueBody body) {
        Matcher block = BLOCK.matcher(body.value().replace("\r\n", "\n"));
        if (!block.find()) {
            return List.of();
        }
        List<AcceptanceCriterion> criteria = new ArrayList<>();
        for (String each : block.group(1).split("\n")) {
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
