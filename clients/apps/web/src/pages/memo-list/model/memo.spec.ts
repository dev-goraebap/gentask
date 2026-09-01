import { describe, expect, it } from 'vitest';
import { parseMemo, summarize } from './memo';

describe('parseMemo', () => {
  it('머리글은 우물 정 개수로 단계를 가릅니다', () => {
    expect(parseMemo('# 이번 주\n## 나중에')).toEqual([
      { kind: 'heading', level: 1, text: '이번 주' },
      { kind: 'heading', level: 2, text: '나중에' },
    ]);
  });

  it('할 일은 대괄호 안의 표시로 끝난 것을 가립니다', () => {
    expect(parseMemo('- [ ] 남은 것\n- [x] 끝난 것')).toEqual([
      { kind: 'todo', done: false, depth: 0, text: '남은 것' },
      { kind: 'todo', done: true, depth: 0, text: '끝난 것' },
    ]);
  });

  it('대문자 표시도 끝난 것으로 읽습니다', () => {
    expect(parseMemo('- [X] 끝난 것')).toEqual([
      { kind: 'todo', done: true, depth: 0, text: '끝난 것' },
    ]);
  });

  it('두 칸을 한 단계로 세어 목록을 중첩합니다', () => {
    expect(parseMemo('- 위\n  - 아래\n    - 더 아래')).toEqual([
      { kind: 'bullet', depth: 0, text: '위' },
      { kind: 'bullet', depth: 1, text: '아래' },
      { kind: 'bullet', depth: 2, text: '더 아래' },
    ]);
  });

  it('별표도 목록으로 읽습니다', () => {
    expect(parseMemo('* 하나')).toEqual([{ kind: 'bullet', depth: 0, text: '하나' }]);
  });

  it('꺾쇠는 인용이고 빈 줄은 빈 줄입니다', () => {
    expect(parseMemo('> 남긴 말\n\n그냥 문장')).toEqual([
      { kind: 'quote', text: '남긴 말' },
      { kind: 'blank' },
      { kind: 'text', text: '그냥 문장' },
    ]);
  });

  it('공백만 있는 줄은 빈 줄입니다', () => {
    expect(parseMemo('   ')).toEqual([{ kind: 'blank' }]);
  });

  it('우물 정이 셋을 넘으면 머리글이 아니라 문장입니다', () => {
    expect(parseMemo('### 셋')).toEqual([{ kind: 'text', text: '### 셋' }]);
  });
});

describe('summarize', () => {
  it('머리글과 빈 줄을 건너뛰고 앞의 두 줄을 잇습니다', () => {
    expect(summarize('# 이번 주\n\n- 첫째\n- 둘째\n- 셋째')).toBe('첫째 · 둘째');
  });

  it('적은 것이 머리글뿐이면 빈 문자열입니다', () => {
    expect(summarize('# 이번 주')).toBe('');
  });
});
