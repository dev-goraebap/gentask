import { describe, expect, it } from 'vitest';
import {
  filterByView,
  describeDue,
  formatDueDate,
  fromDateKey,
  isAddableTitle,
  isCompleted,
  isOverdue,
  sortActive,
  sortCompleted,
  splitByCompletion,
  toDateKey,
  toSortDirection,
  toTaskSort,
  toTaskView,
  type Task,
} from './task';

/*
 * 분류와 정렬 규칙을 검증합니다. 화면이 무엇을 위에 보여 줄지가 여기서 정해집니다.
 * 분기가 있는 코드는 단위 테스트 대상입니다. 17-testing.md 2.1절.
 */
function task(partial: Partial<Task> & Pick<Task, 'id'>): Task {
  return {
    title: partial.id,
    createdAt: '2026-08-01T00:00:00.000Z',
    completedAt: null,
    note: '',
    dueDate: null,
    important: false,
    myDayOn: null,
    ...partial,
  };
}

describe('filterByView', () => {
  const 오늘 = '2026-08-19';

  const 항목 = [
    task({ id: '표시', important: true }),
    task({ id: '오늘담김', myDayOn: 오늘 }),
    task({ id: '어제담김', myDayOn: '2026-08-18' }),
    task({ id: '마감있음', dueDate: '2026-08-25' }),
    task({ id: '마감완료', dueDate: '2026-08-25', completedAt: '2026-08-19T00:00:00.000Z' }),
  ];

  const ids = (view: Parameters<typeof filterByView>[1]) =>
    filterByView(항목, view, 오늘).map((task) => task.id);

  it('전체는 가르지 않는다', () => {
    expect(ids('all')).toEqual(['표시', '오늘담김', '어제담김', '마감있음', '마감완료']);
  });

  it('중요는 표시를 켠 것만 고른다', () => {
    expect(ids('important')).toEqual(['표시']);
  });

  it('나의 하루는 나의 하루에 추가된 것만 고른다', () => {
    // 어제 담은 것은 오늘의 나의 하루가 아닙니다. 담긴 것은 매일 비워집니다.
    expect(ids('my-day')).toEqual(['오늘담김']);
  });

  it('계획된 일정은 기한이 있고 완료하지 않은 것만 고른다', () => {
    // 기한은 아직 해내지 않은 것을 언제까지 해야 하는가의 값입니다.
    expect(ids('planned')).toEqual(['마감있음']);
  });
});

describe('toTaskView', () => {
  it('알 수 없는 값은 전체로 되돌린다', () => {
    expect(toTaskView('없는-값')).toBe('all');
    expect(toTaskView(undefined)).toBe('all');
    expect(toTaskView('my-day')).toBe('my-day');
  });
});

describe('splitByCompletion', () => {
  it('완료 여부로 가른다', () => {
    const { active, completed } = splitByCompletion([
      task({ id: 'a' }),
      task({ id: 'b', completedAt: '2026-08-02T00:00:00.000Z' }),
    ]);

    expect(active.map((t) => t.id)).toEqual(['a']);
    expect(completed.map((t) => t.id)).toEqual(['b']);
  });
});

describe('sortActive', () => {
  it('추가순은 최근에 적은 것이 위로 온다', () => {
    const sorted = sortActive(
      [
        task({ id: 'old', createdAt: '2026-08-01T00:00:00.000Z' }),
        task({ id: 'new', createdAt: '2026-08-03T00:00:00.000Z' }),
        task({ id: 'mid', createdAt: '2026-08-02T00:00:00.000Z' }),
      ],
      'created',
    );

    expect(sorted.map((t) => t.id)).toEqual(['new', 'mid', 'old']);
  });

  it('기한순은 가까운 것이 위로 온다', () => {
    const sorted = sortActive(
      [task({ id: 'late', dueDate: '2026-09-01' }), task({ id: 'soon', dueDate: '2026-08-20' })],
      'due',
    );

    expect(sorted.map((t) => t.id)).toEqual(['soon', 'late']);
  });

  it('기한순에서 정하지 않은 항목은 뒤로 간다', () => {
    // 기한이 없는 것은 늦은 것이 아니라 기한이 없는 것입니다.
    const sorted = sortActive(
      [task({ id: 'none' }), task({ id: 'far', dueDate: '2099-12-31' })],
      'due',
    );

    expect(sorted.map((t) => t.id)).toEqual(['far', 'none']);
  });

  it('기한이 같으면 추가순을 따른다', () => {
    const sorted = sortActive(
      [
        task({ id: 'first', dueDate: '2026-08-20', createdAt: '2026-08-01T00:00:00.000Z' }),
        task({ id: 'later', dueDate: '2026-08-20', createdAt: '2026-08-03T00:00:00.000Z' }),
      ],
      'due',
    );

    expect(sorted.map((t) => t.id)).toEqual(['later', 'first']);
  });

  it('입력 배열을 바꾸지 않는다', () => {
    const input = [
      task({ id: 'a', createdAt: '2026-08-01T00:00:00.000Z' }),
      task({ id: 'b', createdAt: '2026-08-03T00:00:00.000Z' }),
    ];

    sortActive(input, 'created');

    expect(input.map((t) => t.id)).toEqual(['a', 'b']);
  });
});

describe('sortCompleted', () => {
  it('최근에 해낸 것이 위로 온다', () => {
    const sorted = sortCompleted([
      task({ id: 'first', completedAt: '2026-08-01T00:00:00.000Z' }),
      task({ id: 'last', completedAt: '2026-08-03T00:00:00.000Z' }),
    ]);

    expect(sorted.map((t) => t.id)).toEqual(['last', 'first']);
  });
});

describe('sortActive 의 기준과 방향', () => {
  const a = task({
    id: 'a',
    title: '나',
    important: true,
    myDayOn: '2026-08-20',
    createdAt: '2026-08-01T00:00:00.000Z',
  });
  const b = task({
    id: 'b',
    title: '가',
    important: false,
    myDayOn: null,
    createdAt: '2026-08-02T00:00:00.000Z',
  });
  const c = task({
    id: 'c',
    title: '다',
    important: false,
    myDayOn: '2026-08-21',
    createdAt: '2026-08-03T00:00:00.000Z',
  });

  it('중요도는 표시된 것이 앞이고, 뒤집으면 표시되지 않은 것이 앞이다', () => {
    expect(sortActive([b, c, a], 'importance').map((t) => t.id)).toEqual(['a', 'c', 'b']);
    expect(sortActive([b, c, a], 'importance', 'asc').map((t) => t.id)).toEqual(['c', 'b', 'a']);
  });

  it('나의 하루에 추가됨는 최근에 담은 것이 앞이고, 담지 않은 것은 방향과 무관하게 뒤다', () => {
    expect(sortActive([a, b, c], 'my-day').map((t) => t.id)).toEqual(['c', 'a', 'b']);
    expect(sortActive([a, b, c], 'my-day', 'asc').map((t) => t.id)).toEqual(['a', 'c', 'b']);
  });

  it('제목은 한국어 순이다', () => {
    expect(sortActive([a, b, c], 'title').map((t) => t.id)).toEqual(['b', 'a', 'c']);
    expect(sortActive([a, b, c], 'title', 'desc').map((t) => t.id)).toEqual(['c', 'a', 'b']);
  });

  it('만든 날짜를 뒤집으면 오래된 것이 앞이다', () => {
    expect(sortActive([c, a, b], 'created', 'asc').map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('toSortDirection', () => {
  it('아는 값만 받고 나머지는 기준의 기본 방향이다', () => {
    expect(toSortDirection('asc', 'created')).toBe('asc');
    expect(toSortDirection('이상한값', 'created')).toBe('desc');
    expect(toSortDirection(undefined, 'due')).toBe('asc');
  });
});

describe('describeDue', () => {
  it('오늘과 내일은 말로, 나머지는 날짜 뒤에 "까지" 를 붙인다', () => {
    expect(describeDue('2026-08-22', '2026-08-22')).toBe('오늘까지');
    expect(describeDue('2026-08-23', '2026-08-22')).toBe('내일까지');
    expect(describeDue('2026-09-01', '2026-08-22')).toBe('9월 1일까지');
  });

  it('월말을 넘기는 내일도 맞게 판정한다', () => {
    expect(describeDue('2026-09-01', '2026-08-31')).toBe('내일까지');
  });
});

describe('toTaskSort', () => {
  it('아는 값만 받고 나머지는 기본값으로 되돌린다', () => {
    expect(toTaskSort('due')).toBe('due');
    expect(toTaskSort('created')).toBe('created');
    expect(toTaskSort(undefined)).toBe('created');
    // 사용자가 주소를 직접 고친 경우입니다. 화면이 비는 대신 기본 정렬로 뜹니다.
    expect(toTaskSort('없는값')).toBe('created');
  });
});

describe('isCompleted', () => {
  it('완료 시각이 있으면 완료다', () => {
    expect(isCompleted(task({ id: 'a', completedAt: '2026-08-01T00:00:00.000Z' }))).toBe(true);
    expect(isCompleted(task({ id: 'b' }))).toBe(false);
  });
});

describe('isAddableTitle', () => {
  it('공백만 있는 것은 제목이 아니다', () => {
    expect(isAddableTitle('장 보기')).toBe(true);
    expect(isAddableTitle('  ')).toBe(false);
    expect(isAddableTitle('')).toBe(false);
    expect(isAddableTitle('\n\t')).toBe(false);
  });
});

describe('3: 기한', () => {
  it('올해면 연도를 적지 않는다', () => {
    expect(formatDueDate('2026-08-25', new Date(2026, 0, 1))).toBe('8월 25일');
  });

  it('다른 해면 연도를 적는다', () => {
    expect(formatDueDate('2027-01-03', new Date(2026, 0, 1))).toBe('2027년 1월 3일');
  });

  it('오늘보다 앞선 기한은 지난 것으로 본다', () => {
    const task = (dueDate: string | null, completedAt: string | null = null): Task => ({
      id: 'a',
      title: 'a',
      createdAt: '2026-08-01T00:00:00.000Z',
      completedAt,
      note: '',
      dueDate,
      important: false,
      myDayOn: null,
    });

    expect(isOverdue(task('2026-08-14'), '2026-08-18')).toBe(true);
    expect(isOverdue(task('2026-08-25'), '2026-08-18')).toBe(false);
    expect(isOverdue(task('2026-08-18'), '2026-08-18')).toBe(false);
    expect(isOverdue(task(null), '2026-08-18')).toBe(false);

    // 해낸 것은 늦었더라도 판단 대상이 아닙니다.
    expect(isOverdue(task('2026-08-14', '2026-08-20T00:00:00.000Z'), '2026-08-18')).toBe(false);
  });

  it('저장 형식과 달력 값을 오가도 같은 날이 나온다', () => {
    // new Date('2026-08-25') 로 파싱하면 UTC 자정이 되어 한국 시간대에서 하루 앞당겨집니다.
    const date = fromDateKey('2026-08-25');
    expect(date).not.toBeNull();
    expect(toDateKey(date as Date)).toBe('2026-08-25');
    expect((date as Date).getDate()).toBe(25);
  });
});
