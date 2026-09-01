import { describe, expect, it } from 'vitest';
import {
  ISSUE_KINDS,
  ISSUE_STATES,
  isNested,
  matchesFilter,
  orderByHierarchy,
  toKindFilter,
  toStateFilter,
  toggleFilter,
  type IssueSummary,
} from './issue';

function summary(id: string, parentId: string | null = null): IssueSummary {
  return {
    id,
    kind: ISSUE_KINDS.task,
    title: id,
    state: ISSUE_STATES.unstarted,
    parentId,
    dueDate: null,
    closedOn: null,
    childCount: 0,
    closedChildCount: 0,
    criteriaCount: 0,
    unverifiedCount: 0,
    linkedDocTitle: null,
  };
}

describe('toStateFilter', () => {
  const live = [ISSUE_STATES.backlog, ISSUE_STATES.unstarted, ISSUE_STATES.started];

  it('비어 있으면 남은 일만 냅니다', () => {
    expect(toStateFilter(undefined)).toEqual(live);
    expect(toStateFilter('')).toEqual(live);
  });

  it('전부라 적혀 있으면 끝난 것과 접은 것까지 냅니다', () => {
    expect(toStateFilter('all')).toEqual([
      ISSUE_STATES.backlog,
      ISSUE_STATES.unstarted,
      ISSUE_STATES.started,
      ISSUE_STATES.completed,
      ISSUE_STATES.canceled,
    ]);
  });

  it('쉼표로 나열한 것을 읽고 모르는 것은 버립니다', () => {
    expect(toStateFilter('BACKLOG,없는것,COMPLETED')).toEqual([
      ISSUE_STATES.backlog,
      ISSUE_STATES.completed,
    ]);
  });

  it('아는 것이 하나도 없으면 기본값으로 돌아갑니다', () => {
    expect(toStateFilter('없는것')).toEqual(live);
  });
});

describe('toKindFilter', () => {
  it('비어 있으면 유형 전부를 냅니다', () => {
    expect(toKindFilter(undefined)).toHaveLength(4);
  });

  it('나열한 것만 냅니다', () => {
    expect(toKindFilter('BUG')).toEqual([ISSUE_KINDS.bug]);
  });
});

describe('toggleFilter', () => {
  const all = ['A', 'B', 'C'] as const;

  it('켜져 있던 것을 끕니다', () => {
    expect(toggleFilter(['A', 'B'], all, 'B')).toBe('A');
  });

  it('꺼져 있던 것을 켜고 원래 순서로 잇습니다', () => {
    expect(toggleFilter(['C'], all, 'A')).toBe('A,C');
  });

  it('전부 켜지면 비웁니다. 주소에 적을 것이 없습니다', () => {
    expect(toggleFilter(['A', 'B'], all, 'C')).toBeNull();
  });

  it('하나도 남지 않아도 비웁니다', () => {
    expect(toggleFilter(['A'], all, 'A')).toBeNull();
  });
});

describe('orderByHierarchy', () => {
  it('부모 아래에 자식을 붙입니다', () => {
    const issues = [summary('TG-002.01', 'TG-002'), summary('TG-001'), summary('TG-002')];

    expect(orderByHierarchy(issues).map((issue) => issue.id)).toEqual([
      'TG-001',
      'TG-002',
      'TG-002.01',
    ]);
  });

  it('부모가 걸러져 없으면 자식이 뿌리로 올라옵니다', () => {
    const issues = [summary('TG-002.01', 'TG-002'), summary('TG-001')];

    expect(orderByHierarchy(issues).map((issue) => issue.id)).toEqual(['TG-001', 'TG-002.01']);
  });
});

describe('isNested', () => {
  it('부모가 같은 목록에 있을 때만 들여씁니다', () => {
    const child = summary('TG-002.01', 'TG-002');
    const parent = summary('TG-002');

    expect(isNested(child, [parent, child])).toBe(true);
    expect(isNested(child, [child])).toBe(false);
    expect(isNested(parent, [parent, child])).toBe(false);
  });
});

describe('matchesFilter', () => {
  it('유형과 상태를 모두 만족해야 걸립니다', () => {
    const issue = summary('TG-001');

    expect(matchesFilter(issue, [ISSUE_KINDS.task], [ISSUE_STATES.unstarted])).toBe(true);
    expect(matchesFilter(issue, [ISSUE_KINDS.bug], [ISSUE_STATES.unstarted])).toBe(false);
    expect(matchesFilter(issue, [ISSUE_KINDS.task], [ISSUE_STATES.completed])).toBe(false);
  });
});
