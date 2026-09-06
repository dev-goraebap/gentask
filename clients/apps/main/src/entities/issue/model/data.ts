export type ItemKind = 'EPIC' | 'STORY' | 'TASK' | 'BUG';

export type ItemState = '백로그' | '예정' | '진행 중' | '완료' | '취소';

export const ITEM_STATES: ItemState[] = ['백로그', '예정', '진행 중', '완료', '취소'];

export interface Criterion {
  readonly n: number;
  readonly text: string;
  done: boolean;
}

export interface WorkItem {
  readonly id: string;
  readonly kind: ItemKind;
  title: string;
  body: string;
  state: ItemState;
  /** 계층은 식별자가 아니라 이 필드로 관리한다. 부모를 바꿔도 식별자는 유지된다. */
  parentId?: string;
  assignee?: string;
  criteria: Criterion[];
  /** 근거가 되는 문서. 문서 화면에서 역방향으로도 조회한다. */
  docIds: string[];
}

export const INITIAL_ITEMS: WorkItem[] = [
  {
    id: 'GT-1',
    kind: 'EPIC',
    title: '환자가 예약을 스스로 관리한다',
    body: '예약 변경 전화가 하루 종일 걸려 온다. 환자가 직접 처리하면 접수 창구의 부하가 줄어든다.',
    state: '진행 중',
    criteria: [],
    docIds: [],
  },
  {
    id: 'GT-2',
    kind: 'STORY',
    title: '환자가 예약 시간을 변경한다',
    body: '환자는 확정된 예약의 시간을 진료 24시간 전까지 변경할 수 있다.',
    state: '진행 중',
    parentId: 'GT-1',
    assignee: '고재범',
    criteria: [
      { n: 1, text: '예약 상세에서 변경 버튼을 선택하면 변경 가능한 시간대 목록을 표시한다', done: true },
      { n: 2, text: '진료 24시간 이내인 예약은 변경 버튼을 비활성화한다', done: true },
      { n: 3, text: '시간대를 선택하고 확정하면 기존 예약을 갱신하고 확인 알림을 발송한다', done: true },
      { n: 4, text: '선택한 시간대가 그 사이에 마감되면 오류를 표시하고 목록을 다시 조회한다', done: false },
      { n: 5, text: '변경 이력을 예약에 기록하고 접수 직원이 조회할 수 있다', done: false },
    ],
    docIds: ['UC-001'],
  },
  {
    id: 'GT-3',
    kind: 'STORY',
    title: '변경 가능한 시간대를 조회한다',
    body: '담당의의 진료 일정과 이미 확정된 예약을 제외한 시간대만 반환한다.',
    state: '완료',
    parentId: 'GT-1',
    assignee: '윤도경',
    criteria: [
      { n: 1, text: '담당의의 진료 시간 안에서만 시간대를 반환한다', done: true },
      { n: 2, text: '이미 확정된 예약과 겹치는 시간대는 제외한다', done: true },
    ],
    docIds: ['UC-001'],
  },
  {
    id: 'GT-8',
    kind: 'EPIC',
    title: '접수 대기 시간을 줄인다',
    body: '접수 직원이 환자마다 보험 자격을 수동으로 조회하는 동안 대기열이 길어진다.',
    state: '예정',
    criteria: [],
    docIds: [],
  },
  {
    id: 'GT-9',
    kind: 'STORY',
    title: '보험 자격을 자동으로 조회한다',
    body: '환자가 접수하면 보험 자격 조회를 자동으로 실행하고 결과를 접수 화면에 표시한다.',
    state: '예정',
    parentId: 'GT-8',
    assignee: '고재범',
    criteria: [
      { n: 1, text: '접수 등록과 동시에 자격 조회를 요청한다', done: false },
      { n: 2, text: '조회에 실패하면 수동 확인으로 전환하고 접수를 막지 않는다', done: false },
      { n: 3, text: '조회 결과는 당일에만 보관하고 자정에 파기한다', done: false },
    ],
    docIds: ['UC-002'],
  },
  {
    id: 'GT-10',
    kind: 'TASK',
    title: '심사평가원 자격 조회 API를 연동한다',
    body: '인증서 기반 연동이며 테스트 계정은 발급받았다.',
    state: '백로그',
    parentId: 'GT-9',
    criteria: [],
    docIds: [],
  },
  {
    id: 'GT-14',
    kind: 'BUG',
    title: '야간 예약 알림이 두 번 발송된다',
    body: '22시 이후 확정된 예약에서 재현된다. 발송기 재시도가 중복 적재를 만든다.',
    state: '진행 중',
    assignee: '고재범',
    criteria: [
      { n: 1, text: '같은 예약에 같은 종류의 알림은 한 번만 발송한다', done: true },
      { n: 2, text: '재시도로 되돌린 요청이 이미 발송된 예약이면 이력만 기록한다', done: false },
    ],
    docIds: ['ADR-0003'],
  },
  {
    id: 'GT-16',
    kind: 'TASK',
    title: '배포 스크립트에서 하드코딩된 주소를 제거한다',
    body: '환경 변수로 주입하도록 바꾼다. 사용자 가치를 직접 만들지 않으므로 최상위 항목으로 둔다.',
    state: '백로그',
    criteria: [],
    docIds: [],
  },
  {
    id: 'GT-17',
    kind: 'TASK',
    title: '예약 목록 화면의 정렬 기준을 추가한다',
    body: '',
    state: '취소',
    criteria: [],
    docIds: [],
  },
];
