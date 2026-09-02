import { describe, expect, it } from 'vitest';
import { diffLines, type DiffLine } from './diff-lines';

/** 검사에서 읽기 좋게 부호와 글만 남긴다. 줄 번호는 따로 재는 자리가 있다. */
function shape(lines: readonly DiffLine[]): readonly string[] {
  const sign = { same: ' ', added: '+', removed: '-' } as const;
  return lines.map((line) => `${sign[line.mark]}${line.text}`);
}

describe('diffLines', () => {
  it('같은 글은 모든 줄이 그대로다', () => {
    const result = diffLines('가\n나\n다', '가\n나\n다');

    expect(shape(result.lines)).toEqual([' 가', ' 나', ' 다']);
    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(0);
  });

  it('가운데 한 줄을 고치면 지운 줄과 더한 줄이 나란히 선다', () => {
    const result = diffLines('가\n나\n다', '가\n라\n다');

    expect(shape(result.lines)).toEqual([' 가', '-나', '+라', ' 다']);
    expect(result.addedCount).toBe(1);
    expect(result.removedCount).toBe(1);
  });

  it('더하기만 한 줄은 지운 줄을 내지 않는다', () => {
    const result = diffLines('가\n다', '가\n나\n다');

    expect(shape(result.lines)).toEqual([' 가', '+나', ' 다']);
    expect(result.addedCount).toBe(1);
    expect(result.removedCount).toBe(0);
  });

  it('지우기만 한 줄은 더한 줄을 내지 않는다', () => {
    const result = diffLines('가\n나\n다', '가\n다');

    expect(shape(result.lines)).toEqual([' 가', '-나', ' 다']);
    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(1);
  });

  it('앞뒤가 같고 가운데만 통째로 갈린 것을 짚는다', () => {
    const result = diffLines('머리\n가\n나\n꼬리', '머리\n다\n라\n마\n꼬리');

    expect(shape(result.lines)).toEqual([' 머리', '-가', '-나', '+다', '+라', '+마', ' 꼬리']);
  });

  it('줄 번호는 각 개정 안에서 따로 매긴다', () => {
    const result = diffLines('가\n나\n다', '가\n라\n마\n다');

    expect(result.lines.map((line) => [line.mark, line.fromNo, line.toNo])).toEqual([
      ['same', 1, 1],
      ['removed', 2, null],
      ['added', null, 2],
      ['added', null, 3],
      ['same', 3, 4],
    ]);
  });

  it('빈 본문에서 세운 글은 전부 더한 줄이다', () => {
    const result = diffLines('', '가\n나');

    expect(shape(result.lines)).toEqual(['+가', '+나']);
    expect(result.removedCount).toBe(0);
  });

  it('본문을 통째로 비우면 전부 지운 줄이다', () => {
    const result = diffLines('가\n나', '');

    expect(shape(result.lines)).toEqual(['-가', '-나']);
    expect(result.addedCount).toBe(0);
  });

  it('둘 다 비어 있으면 그릴 줄이 없다', () => {
    expect(diffLines('', '').lines).toEqual([]);
  });

  it('줄 끝 규약이 달라도 같은 글로 본다', () => {
    const result = diffLines('가\r\n나', '가\n나');

    expect(shape(result.lines)).toEqual([' 가', ' 나']);
  });

  it('순서를 바꾼 줄은 지운 줄과 더한 줄로 갈린다', () => {
    const result = diffLines('가\n나', '나\n가');

    expect(shape(result.lines)).toEqual(['-가', ' 나', '+가']);
  });

  it('같은 줄이 여러 번 나와도 가장 긴 공통 부분을 남긴다', () => {
    const result = diffLines('가\n나\n가\n다', '가\n다');

    expect(shape(result.lines)).toEqual([' 가', '-나', '-가', ' 다']);
  });

  it('아무 관계 없는 두 글이 아주 길면 세기를 포기하고 통째로 갈렸다고 그린다', () => {
    const from = Array.from({ length: 1200 }, (_, index) => `앞 ${index}`).join('\n');
    const to = Array.from({ length: 1200 }, (_, index) => `뒤 ${index}`).join('\n');

    const result = diffLines(from, to);

    expect(result.tooLarge).toBe(true);
    expect(result.removedCount).toBe(1200);
    expect(result.addedCount).toBe(1200);
    expect(result.lines[0]).toEqual({ mark: 'removed', text: '앞 0', fromNo: 1, toNo: null });
  });

  it('길어도 앞뒤가 같으면 가운데만 재므로 세기를 포기하지 않는다', () => {
    const shared = Array.from({ length: 2000 }, (_, index) => `같은 ${index}`).join('\n');

    const result = diffLines(`${shared}\n가`, `${shared}\n나`);

    expect(result.tooLarge).toBe(false);
    expect(result.addedCount).toBe(1);
    expect(result.removedCount).toBe(1);
  });
});
