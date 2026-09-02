import { displayWidth } from './format.js';
import type { Issue, IssueSummary } from './gentask-client.js';

/**
 * 작업 아이템을 글자로 그린다.
 *
 * <p>백로그가 트래커로 옮겨 간 뒤 사람이 그것을 읽는 자리 하나가 여기다. 화면을 열지 않고도 무엇이
 * 남았는지 보이도록, 목록은 한 줄에 한 항목을 담고 상세는 본문을 그대로 낸다.
 */

const KIND_LABEL: Record<IssueSummary['kind'], string> = {
  EPIC: '에픽',
  STORY: '스토리',
  TASK: '태스크',
  BUG: '버그',
};

const STATE_LABEL: Record<IssueSummary['state'], string> = {
  BACKLOG: '백로그',
  UNSTARTED: '예정',
  STARTED: '진행 중',
  COMPLETED: '닫힘',
  CANCELED: '취소',
};

export function kindLabel(kind: IssueSummary['kind']): string {
  return KIND_LABEL[kind];
}

export function stateLabel(state: IssueSummary['state']): string {
  return STATE_LABEL[state];
}

function padTo(text: string, target: number): string {
  return text + ' '.repeat(Math.max(0, target - displayWidth(text)));
}

/**
 * 목록을 표로 그린다.
 *
 * <p>자식은 제목을 한 칸 들여 부모 아래임을 보인다. 계층을 번호가 갖지 않으므로 눈으로 가릴 자리가
 * 이것뿐이다.
 */
export function formatIssues(issues: readonly IssueSummary[]): string {
  if (issues.length === 0) {
    return '작업 아이템이 없습니다.';
  }

  const rows = issues.map((issue) => ({
    key: issue.key,
    kind: kindLabel(issue.kind),
    state: stateLabel(issue.state),
    title: (issue.parentKey === null ? '' : '  ') + issue.title,
    criteria: issue.criteriaCount === 0 ? '' : `조건 ${issue.unverifiedCount}/${issue.criteriaCount}`,
  }));

  const keyWidth = Math.max(...rows.map((r) => displayWidth(r.key)));
  const kindWidth = Math.max(...rows.map((r) => displayWidth(r.kind)));
  const stateWidth = Math.max(...rows.map((r) => displayWidth(r.state)));
  const titleWidth = Math.max(...rows.map((r) => displayWidth(r.title)), 5);

  return rows
    .map((r) =>
      `${padTo(r.key, keyWidth)}  ${padTo(r.kind, kindWidth)}  ${padTo(r.state, stateWidth)}  ` +
      `${padTo(r.title, titleWidth)}  ${r.criteria}`.trimEnd(),
    )
    .join('\n');
}

/** 하나를 펼친다. 본문은 마크다운 그대로 낸다 — 인수 조건이 그 안에 있다. */
export function formatIssue(issue: Issue): string {
  const s = issue.summary;
  const lines = [
    `${s.key}  ${s.title}`,
    `  유형     ${kindLabel(s.kind)}`,
    `  상태     ${stateLabel(s.state)}`,
  ];

  if (s.parentKey !== null) {
    lines.push(`  부모     ${s.parentKey}`);
  }
  if (s.childCount > 0) {
    lines.push(`  자식     ${s.closedChildCount}/${s.childCount} 닫힘`);
  }
  if (s.dueDate !== null) {
    lines.push(`  기한     ${s.dueDate}`);
  }
  if (s.criteriaCount > 0) {
    lines.push(`  인수조건 ${s.criteriaCount - s.unverifiedCount}/${s.criteriaCount} 확인됨`);
  }
  lines.push(`  세운이   ${issue.authorName}`);

  if (issue.body !== '') {
    lines.push('', issue.body);
  }

  return lines.join('\n');
}
