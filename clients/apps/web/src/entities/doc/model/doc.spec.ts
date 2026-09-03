import { describe, expect, it } from 'vitest';
import { buildCrumbs, docsIn, foldersIn, type DocFolder, type DocSummary } from './doc';

const FOLDERS: readonly DocFolder[] = [
  {
    id: 'arch',
    name: '아키텍처',
    parentId: null,
    docCount: 2,
    folderCount: 1,
    updatedOn: '2026-08-31',
  },
  {
    id: 'adr',
    name: '결정 기록',
    parentId: 'arch',
    docCount: 1,
    folderCount: 0,
    updatedOn: '2026-08-31',
  },
];

function doc(id: string, folderId: string | null): DocSummary {
  return { id, title: id, folderId, updatedOn: '2026-08-31', linkedIssueCount: 0, attachmentCount: 0 };
}

describe('buildCrumbs', () => {
  it('뿌리에서는 문서 하나만 냅니다', () => {
    expect(buildCrumbs(FOLDERS, null)).toEqual([{ id: null, name: '문서' }]);
  });

  it('부모를 거슬러 올라가 순서대로 쌓습니다', () => {
    expect(buildCrumbs(FOLDERS, 'adr')).toEqual([
      { id: null, name: '문서' },
      { id: 'arch', name: '아키텍처' },
      { id: 'adr', name: '결정 기록' },
    ]);
  });

  it('없는 폴더를 가리키면 거기서 멈춥니다', () => {
    expect(buildCrumbs(FOLDERS, '없는것')).toEqual([{ id: null, name: '문서' }]);
  });
});

describe('foldersIn', () => {
  it('해당 폴더의 직속 자식 폴더만 반환한다', () => {
    expect(foldersIn(FOLDERS, null).map((folder) => folder.id)).toEqual(['arch']);
    expect(foldersIn(FOLDERS, 'arch').map((folder) => folder.id)).toEqual(['adr']);
  });
});

describe('docsIn', () => {
  it('그 자리의 문서만 냅니다', () => {
    const docs = [doc('a', null), doc('b', 'arch')];

    expect(docsIn(docs, null).map((entry) => entry.id)).toEqual(['a']);
    expect(docsIn(docs, 'arch').map((entry) => entry.id)).toEqual(['b']);
  });
});
