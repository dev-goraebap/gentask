package xyz.gentask.module.tracker.domain.issue;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 마크다운 본문에서 추출한 단일 인수 조건 값 객체다(결정-0007).
 *
 * 본문 내 '#n' 형식의 체크리스트 항목을 파싱하여 식별하며, 삭제된 항목은 번호를 유지하고 '(결번)'으로 표기한다.
 *
 * @param number 인수 조건 고유 일련번호
 * @param sentence 인수 조건 기술 문장
 * @param verified 확인 완료 여부
 * @param retired 결번 여부
 */
public record AcceptanceCriterion(int number, String sentence, boolean verified, boolean retired) {

    private static final String RETIRED = "(결번)";

    private static final Pattern LINE = Pattern.compile("^- \\[([ x])] #(\\d+) (.+)$");

    /** 본문에서 번호 매김 체크리스트 항목을 전수 파싱한다. */
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

    /** 결번을 제외한 유효 인수 조건 수를 반환한다. */
    public static int count(List<AcceptanceCriterion> criteria) {
        return (int) criteria.stream().filter(each -> !each.retired()).count();
    }

    /** 결번을 제외한 미확인 인수 조건 수를 반환한다. */
    public static int unverifiedCount(List<AcceptanceCriterion> criteria) {
        return (int) criteria.stream()
                .filter(each -> !each.retired())
                .filter(each -> !each.verified())
                .count();
    }
}
