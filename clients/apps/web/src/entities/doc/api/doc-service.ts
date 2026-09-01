import { computed, Injectable, signal } from '@angular/core';
import type { Doc, DocFolder, DocSummary } from '../model/doc';

/**
 * 문서를 담는 자리.
 *
 * <p>[IssueService]와 같은 이유로 목이다. 담은 것은 이 저장소의 `docs/architecture` 이며, 트래커로
 * 옮길 대상을 그대로 두어야 폴더 깊이와 문서 수를 화면이 감당하는지 드러난다.
 */
const FOLDERS: readonly DocFolder[] = [
  { id: 'arch', name: '아키텍처', parentId: null, docCount: 5, updatedOn: '2026-08-31' },
  { id: 'usecase', name: '유스케이스', parentId: null, docCount: 14, updatedOn: '2026-08-30' },
  { id: 'adr', name: '결정 기록', parentId: 'arch', docCount: 13, updatedOn: '2026-08-31' },
  { id: 'concepts', name: '개념', parentId: 'arch', docCount: 9, updatedOn: '2026-08-30' },
];

const DOCS: readonly Doc[] = [
  {
    id: 'arch-index',
    title: '아키텍처 진입',
    folderId: 'arch',
    updatedOn: '2026-08-31',
    linkedIssueCount: 3,
    attachmentCount: 0,
    authorName: '고래밥',
    version: 7,
    blocks: [
      {
        kind: 'paragraph',
        text: 'arc42 템플릿 구조를 따르는 gentask 의 참조 아키텍처 최상위 문서입니다. 세부 영역별 설계와 결정 사항은 하위 문서와 결정 기록이 갖습니다.',
      },
      { kind: 'heading', text: '읽는 순서' },
      {
        kind: 'bullets',
        items: [
          '개발 프로세스는 결정-0007 을 따릅니다.',
          '테스트는 결정-0008 을 따릅니다.',
          '횡단 관심사는 개념 폴더의 문서를 확인합니다.',
        ],
      },
    ],
    attachments: [],
    linkedIssues: [{ id: 'TG-012', title: '작업 아이템과 문서를 트래커로 옮긴다' }],
  },
  {
    id: 'arch-01',
    title: '1. 서론과 목표',
    folderId: 'arch',
    updatedOn: '2026-08-30',
    linkedIssueCount: 0,
    attachmentCount: 0,
    authorName: '고래밥',
    version: 3,
    blocks: [
      {
        kind: 'paragraph',
        text: 'ISO/IEC 25010 을 기반으로 이 시스템이 최우선으로 만족해야 하는 품질 특성 셋을 정의합니다.',
      },
      {
        kind: 'bullets',
        items: [
          '보안 — 데이터는 계정 단위로 격리되며 타 계정 리소스는 존재 여부를 노출하지 않습니다.',
          '상호작용 능력 — 같은 흐름이 데스크톱과 모바일에서 모두 완결됩니다.',
          '성능 효율성 — 상태 변경이 화면 전체를 다시 그리지 않습니다.',
        ],
      },
    ],
    attachments: [],
    linkedIssues: [],
  },
  {
    id: 'arch-03',
    title: '3. 컨텍스트와 범위',
    folderId: 'arch',
    updatedOn: '2026-08-29',
    linkedIssueCount: 0,
    attachmentCount: 2,
    authorName: '고래밥',
    version: 5,
    blocks: [
      {
        kind: 'paragraph',
        text: '시스템이 바깥과 닿는 자리를 적습니다. 브라우저, 명령줄 도구, 메일 발송, 객체 저장소가 그 자리입니다.',
      },
    ],
    attachments: [
      { name: '컨텍스트-다이어그램.png', size: '124 KB' },
      { name: '외부-연동-목록.csv', size: '6 KB' },
    ],
    linkedIssues: [],
  },
  {
    id: 'arch-07',
    title: '7. 배포 뷰',
    folderId: 'arch',
    updatedOn: '2026-08-31',
    linkedIssueCount: 0,
    attachmentCount: 0,
    authorName: '고래밥',
    version: 9,
    blocks: [
      {
        kind: 'paragraph',
        text: '단일 서버에 컨테이너로 올립니다. 접속 대상과 서버 내 경로는 변수로 두고 실제 값은 추적되지 않는 파일에 둡니다.',
      },
    ],
    attachments: [],
    linkedIssues: [],
  },
  {
    id: 'arch-09',
    title: '9. 아키텍처 결정',
    folderId: 'arch',
    updatedOn: '2026-08-31',
    linkedIssueCount: 0,
    attachmentCount: 0,
    authorName: '고래밥',
    version: 14,
    blocks: [{ kind: 'paragraph', text: '결정 기록의 목차입니다. 본문은 결정 기록 폴더가 갖습니다.' }],
    attachments: [],
    linkedIssues: [],
  },
  {
    id: 'adr-0013',
    title: '결정-0013: MCP 를 걷고 명령줄 도구를 세운다',
    folderId: 'adr',
    updatedOn: '2026-08-31',
    linkedIssueCount: 2,
    attachmentCount: 2,
    authorName: '고래밥',
    version: 4,
    blocks: [
      { kind: 'paragraph', text: '상태 승인됨 · 날짜 2026-08-31' },
      { kind: 'heading', text: '맥락' },
      {
        kind: 'paragraph',
        text: 'MCP 는 도구 정의를 대화 시작에 전부 싣습니다. 지금 여덟은 감당되지만 다루는 것을 작업 아이템까지 넓히면 스물을 넘고, 도구 목록이 평면이라 전부 함께 실립니다.',
      },
      {
        kind: 'paragraph',
        text: '명령줄 도구는 하위 명령마다 도움말이 나뉩니다. 에이전트가 필요한 가지만 읽습니다.',
      },
      { kind: 'heading', text: '결정' },
      {
        kind: 'bullets',
        items: [
          'MCP 서버를 걷고 명령줄 도구를 npm 에 발행합니다.',
          '자격은 설정 파일과 환경 변수가 갖습니다. 인자로 받지 않습니다.',
          '찾는 일은 서버가 갖습니다. 내려받아 로컬에서 훑지 않습니다.',
        ],
      },
      { kind: 'heading', text: '감수하는 것' },
      {
        kind: 'paragraph',
        text: 'git 과 gh 가 누리는 학습 데이터 이점이 자체 제작 명령에는 없습니다. 모델은 명령을 모르며 도움말을 읽어야 하고, 그 도움말이 곧 계약입니다.',
      },
      { kind: 'code', text: 'gentask issue list --state open\ngentask doc cat 결정-0013' },
    ],
    attachments: [
      { name: '도구-정의-길이-실측.csv', size: '3 KB' },
      { name: 'mcp-대화-시작-덤프.txt', size: '41 KB' },
    ],
    linkedIssues: [
      { id: 'TG-011', title: '에이전트가 명령줄로 작업 다루기' },
      { id: 'TG-012', title: '작업 아이템과 문서를 트래커로 옮긴다' },
    ],
  },
  {
    id: 'ntf-001',
    title: 'NTF-001 알림 받기',
    folderId: 'usecase',
    updatedOn: '2026-08-29',
    linkedIssueCount: 1,
    attachmentCount: 0,
    authorName: '고래밥',
    version: 2,
    blocks: [
      { kind: 'heading', text: '기본 흐름' },
      {
        kind: 'bullets',
        items: [
          '사용자가 알림 받기를 고른다.',
          '시스템이 브라우저에 허용을 구한다.',
          '사용자가 허용한다.',
          '시스템이 구독을 저장하고 받는 상태를 알린다.',
        ],
      },
    ],
    attachments: [],
    linkedIssues: [{ id: 'TG-007.01', title: '이 기기로 알림 받기' }],
  },
];

function toSummary(doc: Doc): DocSummary {
  return {
    id: doc.id,
    title: doc.title,
    folderId: doc.folderId,
    updatedOn: doc.updatedOn,
    linkedIssueCount: doc.linkedIssueCount,
    attachmentCount: doc.attachmentCount,
  };
}

@Injectable()
export class DocService {
  // --- 상태 --------------------------------------------------------------------------------------
  private readonly docs = signal<readonly Doc[]>(DOCS);
  private readonly folderList = signal<readonly DocFolder[]>(FOLDERS);

  // --- 파생 --------------------------------------------------------------------------------------
  readonly folders = this.folderList.asReadonly();
  readonly list = computed<readonly DocSummary[]>(() => this.docs().map(toSummary));

  // --- 동작 --------------------------------------------------------------------------------------
  find(id: string): Doc | undefined {
    return this.docs().find((doc) => doc.id === id);
  }

  /** 만든 문서의 식별자를 낸다. 호출부가 곧바로 그 자리로 옮기기 때문이다. */
  addDoc(title: string, folderId: string | null): string {
    const id = `doc-${this.docs().length + 1}`;

    this.docs.update((docs) => [
      ...docs,
      {
        id,
        title,
        folderId,
        updatedOn: '2026-08-31',
        linkedIssueCount: 0,
        attachmentCount: 0,
        authorName: '고래밥',
        version: 1,
        blocks: [],
        attachments: [],
        linkedIssues: [],
      },
    ]);

    return id;
  }

  addFolder(name: string, parentId: string | null): void {
    this.folderList.update((folders) => [
      ...folders,
      {
        id: `folder-${folders.length + 1}`,
        name,
        parentId,
        docCount: 0,
        updatedOn: '2026-08-31',
      },
    ]);
  }
}
