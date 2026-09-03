import { describe, expect, it } from 'vitest';
import type { DocFolder } from '@/entities/doc';
import { moveTargets } from './move-targets';

function folder(id: string, parentId: string | null): DocFolder {
  return { id, name: id, parentId, docCount: 0, folderCount: 0, updatedOn: '2026-08-31' };
}

/** 아키텍처 > 결정 기록 > 기각 · 그리고 나란한 회의록. */
const FOLDERS: readonly DocFolder[] = [
  folder('아키텍처', null),
  folder('결정 기록', '아키텍처'),
  folder('기각', '결정 기록'),
  folder('회의록', null),
];

describe('moveTargets', () => {
  it('지금 담긴 자리는 옮길 자리가 아니다', () => {
    const ids = moveTargets(FOLDERS, '아키텍처', null).map((target) => target.id);

    expect(ids).not.toContain('아키텍처');
    expect(ids).toContain(null);
    expect(ids).toContain('회의록');
  });

  it('폴더를 옮길 때 자기 자신과 자손을 고를 수 없다', () => {
    const ids = moveTargets(FOLDERS, null, '아키텍처').map((target) => target.id);

    expect(ids).toEqual(['회의록']);
  });

  it('최상위에 있는 것은 최상위를 다시 고를 수 없다', () => {
    const ids = moveTargets(FOLDERS, null, null).map((target) => target.id);

    expect(ids).not.toContain(null);
    expect(ids).toEqual(['아키텍처', '결정 기록', '기각', '회의록']);
  });

  it('이름이 아니라 지나온 길을 보인다', () => {
    const target = moveTargets(FOLDERS, null, null).find((each) => each.id === '기각');

    expect(target?.path).toBe('문서 / 아키텍처 / 결정 기록 / 기각');
  });

  it('부모가 서로를 가리켜도 멈춘다', () => {
    const cycle = [folder('가', '나'), folder('나', '가')];

    expect(moveTargets(cycle, null, '가').map((target) => target.id)).toEqual([]);
  });
});
