import { computed, Injectable, signal } from '@angular/core';
import {
  ISSUE_KINDS,
  ISSUE_STATES,
  type Issue,
  type IssueKind,
  type IssueState,
  type IssueSummary,
} from '../model/issue';

/**
 * 작업 아이템을 담는 자리.
 *
 * <p>지금은 서버가 없으므로 목이 데이터를 갖는다. 화면이 확정되면 이 클래스의 공개 면이 API 계약의
 * 초안이 되고, 그때 안쪽만 조회와 명령으로 갈아 끼운다(결정-0007 구현 규약).
 *
 * <p>담은 것은 이 저장소 자신의 백로그다. 트래커로 옮기는 것이 목표이므로 옮길 대상을 그대로 두어야
 * 화면이 실제로 감당하는지 드러난다.
 */
const SEED: readonly Issue[] = [
  {
    id: 'TG-007',
    kind: ISSUE_KINDS.epic,
    title: '알림 받기',
    state: ISSUE_STATES.started,
    parentId: null,
    dueDate: null,
    closedOn: null,
    childCount: 3,
    closedChildCount: 1,
    criteriaCount: 0,
    unverifiedCount: 0,
    linkedDocTitle: null,
    body: '정한 시각이 되면 알림이 기기에 닿는다. 기기마다 허용을 따로 받고, 닿지 않은 자리는 관리 화면이 본다.',
    authorName: '고래밥',
    createdOn: '2026-08-26',
    criteria: [],
    linkedDocIds: [],
    commits: [],
    attachmentNames: [],
  },
  {
    id: 'TG-007.01',
    kind: ISSUE_KINDS.story,
    title: '이 기기로 알림 받기',
    state: ISSUE_STATES.started,
    parentId: 'TG-007',
    dueDate: null,
    closedOn: null,
    childCount: 0,
    closedChildCount: 0,
    criteriaCount: 4,
    unverifiedCount: 1,
    linkedDocTitle: 'NTF-001 알림 받기',
    body: '기기마다 알림을 따로 허용받는다. 허용은 브라우저가 갖고 우리는 그 결과로 받은 구독을 저장한다.\n\n허용을 거절한 기기는 다시 묻지 않는다. 브라우저가 그 상태를 기억하므로 우리가 되묻는 것은 닫힌 문을 두드리는 일이다.',
    authorName: '고래밥',
    createdOn: '2026-08-29',
    criteria: [
      {
        number: 1,
        sentence: '사용자가 알림 받기를 누르면 시스템은 브라우저의 허용을 구하고 받은 구독을 저장한다',
        verified: true,
        retired: false,
      },
      {
        number: 2,
        sentence: '사용자가 허용을 거절하면 시스템은 그 기기에서 알림 받기를 다시 묻지 않는다',
        verified: true,
        retired: false,
      },
      {
        number: 3,
        sentence: '구독이 만료된 기기로 보내면 시스템은 그 구독을 지운다',
        verified: false,
        retired: false,
      },
      { number: 4, sentence: '', verified: false, retired: true },
    ],
    linkedDocIds: ['ntf-001'],
    commits: [{ sha: 'dbc3c81', subject: 'feat(frontend): 이 기기로 알림을 받는 자리를 세운다' }],
    attachmentNames: ['허용-거절-화면.png'],
  },
  {
    id: 'TG-007.03',
    kind: ISSUE_KINDS.story,
    title: '홈 화면에 설치하기',
    state: ISSUE_STATES.unstarted,
    parentId: 'TG-007',
    dueDate: null,
    closedOn: null,
    childCount: 0,
    closedChildCount: 0,
    criteriaCount: 3,
    unverifiedCount: 3,
    linkedDocTitle: null,
    body: 'iOS 는 홈 화면에 설치해야 알림을 받는다. 설치하는 길을 화면이 안내한다.',
    authorName: '고래밥',
    createdOn: '2026-08-29',
    criteria: [
      {
        number: 1,
        sentence: '사용자가 설치하지 않은 iOS 에서 알림을 켜려 하면 시스템은 설치를 먼저 안내한다',
        verified: false,
        retired: false,
      },
      {
        number: 2,
        sentence: '사용자가 홈 화면에서 열면 시스템은 안내를 감춘다',
        verified: false,
        retired: false,
      },
      {
        number: 3,
        sentence: '설치를 지원하지 않는 브라우저에서 열면 시스템은 안내 대신 지원하지 않음을 알린다',
        verified: false,
        retired: false,
      },
    ],
    linkedDocIds: [],
    commits: [],
    attachmentNames: [],
  },
  {
    id: 'TG-012',
    kind: ISSUE_KINDS.epic,
    title: '작업 아이템과 문서를 트래커로 옮긴다',
    state: ISSUE_STATES.started,
    parentId: null,
    dueDate: null,
    closedOn: null,
    childCount: 2,
    closedChildCount: 0,
    criteriaCount: 0,
    unverifiedCount: 0,
    linkedDocTitle: null,
    body: '저장소의 마크다운으로 관리하던 백로그와 문서를 트래커가 갖는다. 사람은 화면으로 읽고 에이전트는 명령줄로 읽는다.',
    authorName: '고래밥',
    createdOn: '2026-08-31',
    criteria: [],
    linkedDocIds: ['adr-0013'],
    commits: [],
    attachmentNames: [],
  },
  {
    id: 'TG-012.01',
    kind: ISSUE_KINDS.story,
    title: '프로젝트를 골라 그 안의 작업 아이템만 보기',
    state: ISSUE_STATES.unstarted,
    parentId: 'TG-012',
    dueDate: null,
    closedOn: null,
    childCount: 0,
    closedChildCount: 0,
    criteriaCount: 0,
    unverifiedCount: 0,
    linkedDocTitle: null,
    body: '트래커의 모든 자리가 고른 프로젝트 하나에 매인다. 계정을 만들 때 기본 프로젝트가 함께 선다.',
    authorName: '고래밥',
    createdOn: '2026-08-31',
    criteria: [],
    linkedDocIds: [],
    commits: [],
    attachmentNames: [],
  },
  {
    id: 'TG-012.02',
    kind: ISSUE_KINDS.story,
    title: '문서를 폴더로 묶어 보기',
    state: ISSUE_STATES.backlog,
    parentId: 'TG-012',
    dueDate: null,
    closedOn: null,
    childCount: 0,
    closedChildCount: 0,
    criteriaCount: 0,
    unverifiedCount: 0,
    linkedDocTitle: null,
    body: '폴더가 폴더를 담는다. 문서 본문은 마크다운이며 첨부는 본문이 아니라 문서에 붙는다.',
    authorName: '고래밥',
    createdOn: '2026-08-31',
    criteria: [],
    linkedDocIds: [],
    commits: [],
    attachmentNames: [],
  },
  {
    id: 'TG-011',
    kind: ISSUE_KINDS.task,
    title: '에이전트가 명령줄로 작업 다루기',
    state: ISSUE_STATES.completed,
    parentId: null,
    dueDate: null,
    closedOn: '2026-08-31',
    childCount: 0,
    closedChildCount: 0,
    criteriaCount: 2,
    unverifiedCount: 0,
    linkedDocTitle: '결정-0013 MCP 를 걷고 명령줄 도구를 세운다',
    body: 'MCP 를 걷고 명령줄 도구를 세운다. 자격은 설정 파일과 환경 변수가 갖고 인자로 받지 않는다.',
    authorName: '고래밥',
    createdOn: '2026-08-30',
    criteria: [
      {
        number: 1,
        sentence: '에이전트가 명령을 부르면 시스템은 그 계정의 작업만 낸다',
        verified: true,
        retired: false,
      },
      {
        number: 2,
        sentence: '자격이 없는 채로 부르면 시스템은 자격을 세우는 길을 알린다',
        verified: true,
        retired: false,
      },
    ],
    linkedDocIds: ['adr-0013'],
    commits: [{ sha: '1fe676c', subject: 'feat(cli): MCP 서버를 걷고 명령줄 도구를 세운다' }],
    attachmentNames: [],
  },
  {
    id: 'TG-015',
    kind: ISSUE_KINDS.bug,
    title: '가상 키보드가 올라오면 적는 자리를 덮는다',
    state: ISSUE_STATES.unstarted,
    parentId: null,
    dueDate: '2026-09-03',
    closedOn: null,
    childCount: 0,
    closedChildCount: 0,
    criteriaCount: 1,
    unverifiedCount: 1,
    linkedDocTitle: null,
    body: '좁은 화면에서 적는 자리를 키보드가 덮는다. Android Chrome 에서 확인했다.\n\n셸이 `h-dvh` 에 `overflow-hidden` 이라 문서가 스크롤되지 않고, `100dvh` 는 가상 키보드가 줄이지 않는 레이아웃 뷰포트 기준이다. iOS 에서도 겪는지 확인하는 것이 착수 조건이다.',
    authorName: '고래밥',
    createdOn: '2026-08-29',
    criteria: [
      {
        number: 1,
        sentence: '좁은 화면에서 적는 자리에 초점이 가면 시스템은 그 자리를 키보드 위에 둔다',
        verified: false,
        retired: false,
      },
    ],
    linkedDocIds: [],
    commits: [],
    attachmentNames: ['android-chrome-키보드.png'],
  },
];

/** 더 손댈 것이 없는 자리로 옮겼는가. 그 순간을 닫힌 날로 남긴다. */
function isSettledState(state: IssueState): boolean {
  return state === ISSUE_STATES.completed || state === ISSUE_STATES.canceled;
}

function toSummary(issue: Issue): IssueSummary {
  return {
    id: issue.id,
    kind: issue.kind,
    title: issue.title,
    state: issue.state,
    parentId: issue.parentId,
    dueDate: issue.dueDate,
    closedOn: issue.closedOn,
    childCount: issue.childCount,
    closedChildCount: issue.closedChildCount,
    criteriaCount: issue.criteriaCount,
    unverifiedCount: issue.unverifiedCount,
    linkedDocTitle: issue.linkedDocTitle,
  };
}

@Injectable()
export class IssueService {
  // --- 상태 --------------------------------------------------------------------------------------
  private readonly issues = signal<readonly Issue[]>(SEED);

  // --- 파생 --------------------------------------------------------------------------------------
  readonly list = computed<readonly IssueSummary[]>(() => this.issues().map(toSummary));

  // --- 동작 --------------------------------------------------------------------------------------
  find(id: string): Issue | undefined {
    return this.issues().find((issue) => issue.id === id);
  }

  /**
   * 번호는 서버가 매긴다. 목에서는 지금 있는 것의 다음 번호를 쓴다.
   *
   * <p>세운 것의 식별자를 낸다. 호출부가 곧바로 그 자리로 옮기거나 덮개를 닫기 때문이다.
   */
  add(title: string, kind: IssueKind, body = ''): string {
    const taken = this.issues()
      .map((issue) => Number(/^TG-(\d+)$/.exec(issue.id)?.[1] ?? 0))
      .filter((number) => Number.isFinite(number));
    const id = `TG-${String(Math.max(0, ...taken) + 1).padStart(3, '0')}`;

    this.issues.update((issues) => [
      ...issues,
      {
        id,
        kind,
        title,
        state: ISSUE_STATES.backlog,
        parentId: null,
        dueDate: null,
        closedOn: null,
        childCount: 0,
        closedChildCount: 0,
        criteriaCount: 0,
        unverifiedCount: 0,
        linkedDocTitle: null,
        body,
        authorName: '고래밥',
        createdOn: '2026-08-31',
        criteria: [],
        linkedDocIds: [],
        commits: [],
        attachmentNames: [],
      },
    ]);

    return id;
  }

  setState(id: string, state: IssueState): void {
    this.issues.update((issues) =>
      issues.map((issue) =>
        issue.id === id
          ? { ...issue, state, closedOn: isSettledState(state) ? '2026-08-31' : null }
          : issue,
      ),
    );
  }
}
