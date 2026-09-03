import { displayWidth, padTo } from './format.js';
import type { Issue, IssueSummary } from './gentask-client.js';

/**
 * 작업 항목 터미널 콘솔 출력 서식 모듈.
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

/**
 * 작업 항목 목록을 계층형 콘솔 표 형식으로 출력한다. 하위 항목은 들여쓰기를 적용한다.
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

/** 단일 작업 항목의 상세 내용 및 인수 조건을 콘솔에 출력한다. */
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
