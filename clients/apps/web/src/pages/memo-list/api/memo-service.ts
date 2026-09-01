import { Injectable, signal } from '@angular/core';
import type { Memo } from '../model/memo';

/**
 * 메모를 담는 자리.
 *
 * <p>서버가 서기 전까지 목이 데이터를 갖는다. 화면이 확정되면 이 클래스의 공개 면이 API 계약의
 * 초안이 된다(결정-0007 구현 규약).
 */
const SEED: readonly Memo[] = [
  {
    id: 'memo-1',
    title: '이번 주에 걸린 것들',
    body: [
      '# 이번 주',
      '',
      '- [ ] 트래커 화면 확정하기',
      '- [x] PRD 개정',
      '- 서버 검색 어떻게 하지',
      '  - tsvector 로 갈지 그냥 like 로 버틸지',
      '  - 한글 형태소가 걸린다. 찾아볼 것',
      '',
      '## 나중에',
      '반려팻 성장 규칙 — 완료 하나당 뭘 주지?',
      '  일단 완료 개수만 세어 두고 나중에 정하기',
      '',
      '> 정리되면 작업 아이템으로 올린다. 여기는 정리 전 자리다.',
    ].join('\n'),
    updatedAt: '2026-08-31 21:14',
  },
  {
    id: 'memo-2',
    title: '배포 순서 정리',
    body: [
      '- nginx 먼저 내리고 컨테이너 갈기',
      '- 인증서는 만료 30일 전에 갱신',
      '- 옛 자산은 지우지 말고 남겨 두기',
    ].join('\n'),
    updatedAt: '2026-08-30 18:02',
  },
  {
    id: 'memo-3',
    title: '읽을 것',
    body: ['- Use-Case 3.0 원칙 10 다시 보기', '- EARS 문법 정리한 글'].join('\n'),
    updatedAt: '2026-08-28 09:40',
  },
];

@Injectable()
export class MemoService {
  // --- 상태 --------------------------------------------------------------------------------------
  private readonly memos = signal<readonly Memo[]>(SEED);

  // --- 파생 --------------------------------------------------------------------------------------
  readonly list = this.memos.asReadonly();

  // --- 동작 --------------------------------------------------------------------------------------
  find(id: string): Memo | undefined {
    return this.memos().find((memo) => memo.id === id);
  }

  add(): string {
    const id = `memo-${this.memos().length + 1}`;
    this.memos.update((memos) => [
      { id, title: '새 메모', body: '', updatedAt: '2026-08-31 21:30' },
      ...memos,
    ]);
    return id;
  }

  write(id: string, body: string): void {
    this.memos.update((memos) =>
      memos.map((memo) => (memo.id === id ? { ...memo, body, updatedAt: '2026-08-31 21:30' } : memo)),
    );
  }

  rename(id: string, title: string): void {
    this.memos.update((memos) =>
      memos.map((memo) => (memo.id === id ? { ...memo, title } : memo)),
    );
  }
}
