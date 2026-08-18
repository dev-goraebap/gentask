import { describe, expect, it } from 'vitest';
import { isAddableTitle, isCompleted, splitByCompletion, type Task } from './task';

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
    ...partial,
  };
}

describe('splitByCompletion', () => {
  it('완료 여부로 가른다', () => {
    const { active, completed } = splitByCompletion([
      task({ id: 'a' }),
      task({ id: 'b', completedAt: '2026-08-02T00:00:00.000Z' }),
    ]);

    expect(active.map((t) => t.id)).toEqual(['a']);
    expect(completed.map((t) => t.id)).toEqual(['b']);
  });

  it('미완료는 최근에 적은 것이 위로 온다', () => {
    const { active } = splitByCompletion([
      task({ id: 'old', createdAt: '2026-08-01T00:00:00.000Z' }),
      task({ id: 'new', createdAt: '2026-08-03T00:00:00.000Z' }),
      task({ id: 'mid', createdAt: '2026-08-02T00:00:00.000Z' }),
    ]);

    expect(active.map((t) => t.id)).toEqual(['new', 'mid', 'old']);
  });

  it('완료는 최근에 해낸 것이 위로 온다', () => {
    const { completed } = splitByCompletion([
      task({ id: 'first', completedAt: '2026-08-01T00:00:00.000Z' }),
      task({ id: 'last', completedAt: '2026-08-03T00:00:00.000Z' }),
    ]);

    expect(completed.map((t) => t.id)).toEqual(['last', 'first']);
  });

  it('입력 배열을 바꾸지 않는다', () => {
    const input = [
      task({ id: 'a', createdAt: '2026-08-01T00:00:00.000Z' }),
      task({ id: 'b', createdAt: '2026-08-03T00:00:00.000Z' }),
    ];

    splitByCompletion(input);

    expect(input.map((t) => t.id)).toEqual(['a', 'b']);
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
