import type { IconName } from '@/shared/ui/icon';

/**
 * 작업 아이템의 유형. Jira 와 Plane 의 유형 체계를 기준점으로 삼는다(PRD 1.3).
 *
 * <p>`TASK` 는 투두 모드의 할 일과 다른 것이다. 그쪽은 개인의 할 일이고 이쪽은 프로젝트에 속한
 * 작업 아이템의 한 유형이다.
 */
export const ISSUE_KINDS = {
  epic: 'EPIC',
  story: 'STORY',
  task: 'TASK',
  bug: 'BUG',
} as const;

export type IssueKind = (typeof ISSUE_KINDS)[keyof typeof ISSUE_KINDS];

/**
 * 작업 아이템의 상태 다섯.
 *
 * <p>이름은 Plane 과 Linear 의 상태 묶음에서 가져왔다. 가르는 축이 착수 여부가 아니라 **하기로
 * 정했는가**다 — 백로그와 예정은 둘 다 시작하지 않은 것이며, 백로그는 아직 정하지 않은 것이고
 * 예정은 정했으나 아직 손대지 않은 것이다.
 *
 * <p>`COMPLETED` 는 인수 조건이 참임을 확인한 것을 뜻한다(결정-0007). `CANCELED` 는 근거를 잃어
 * 더 이상 유효하지 않은 것이며, 끝난 것과 다르므로 자리를 따로 갖는다.
 */
export const ISSUE_STATES = {
  backlog: 'BACKLOG',
  unstarted: 'UNSTARTED',
  started: 'STARTED',
  completed: 'COMPLETED',
  canceled: 'CANCELED',
} as const;

export type IssueState = (typeof ISSUE_STATES)[keyof typeof ISSUE_STATES];

/** 인수 조건 하나. 번호는 부여 뒤 바뀌지 않으며 지운 자리는 결번으로 남는다. */
export interface AcceptanceCriterion {
  readonly number: number;
  readonly sentence: string;
  readonly verified: boolean;
  /** 결번은 문장을 지우는 대신 이 표시로 남긴다. */
  readonly retired: boolean;
}

/** 이어진 커밋. 저장소를 이어 두면 커밋 메시지가 가리킨 작업 아이템에 붙는다. */
export interface IssueCommit {
  readonly sha: string;
  readonly subject: string;
}

/** 목록이 받는 작업 아이템. 본문과 인수 조건은 상세에서만 온다. */
export interface IssueSummary {
  /** 사람이 부르는 이름(`GT-30`). 주소가 이것을 담으므로 화면은 이것으로 다닌다. */
  readonly id: string;
  /** 프로젝트 안의 번호. API 가 받는 것은 이쪽이다. */
  readonly number: number;
  readonly kind: IssueKind;
  readonly title: string;
  readonly state: IssueState;
  readonly parentId: string | null;
  readonly dueDate: string | null;
  readonly closedOn: string | null;
  readonly childCount: number;
  readonly closedChildCount: number;
  readonly criteriaCount: number;
  readonly unverifiedCount: number;
  readonly linkedDocTitle: string | null;
}

/** 상세가 받는 작업 아이템. */
export interface Issue extends IssueSummary {
  readonly body: string;
  readonly authorName: string;
  readonly createdOn: string;
  readonly criteria: readonly AcceptanceCriterion[];
  readonly linkedDocIds: readonly string[];
  readonly commits: readonly IssueCommit[];
  readonly attachmentNames: readonly string[];
}

interface KindFace {
  readonly value: IssueKind;
  readonly label: string;
  readonly icon: IconName;
}

/** 유형이 화면에 나타나는 모습. 목록의 거르개와 상세의 고르개가 같은 것을 본다. */
export const ISSUE_KIND_FACES: readonly KindFace[] = [
  { value: ISSUE_KINDS.epic, label: '에픽', icon: 'hgiFlash' },
  { value: ISSUE_KINDS.story, label: '스토리', icon: 'hgiBookmark' },
  { value: ISSUE_KINDS.task, label: '태스크', icon: 'hgiCheck' },
  { value: ISSUE_KINDS.bug, label: '버그', icon: 'hgiBug' },
];

interface StateFace {
  readonly value: IssueState;
  readonly label: string;
}

export const ISSUE_STATE_FACES: readonly StateFace[] = [
  { value: ISSUE_STATES.backlog, label: '백로그' },
  { value: ISSUE_STATES.unstarted, label: '예정' },
  { value: ISSUE_STATES.started, label: '진행 중' },
  { value: ISSUE_STATES.completed, label: '닫힘' },
  { value: ISSUE_STATES.canceled, label: '취소' },
];

/** 아직 끝나지 않은 것. 목록을 처음 열었을 때 눈에 먼저 들어와야 하는 것들이다. */
const LIVE_STATES: readonly IssueState[] = [
  ISSUE_STATES.backlog,
  ISSUE_STATES.unstarted,
  ISSUE_STATES.started,
];

/**
 * 이름에서 번호를 읽는다.
 *
 * <p>붙이는 규칙은 서버가 갖는다. 여기는 읽기만 하므로 접두어의 모양이 바뀌어도 따라 고칠 것이 없다.
 */
export function issueNumberOf(id: string): number {
  return Number(id.slice(id.lastIndexOf('-') + 1));
}

export function issueKindLabel(kind: IssueKind): string {
  return ISSUE_KIND_FACES.find((face) => face.value === kind)?.label ?? '태스크';
}

export function issueKindIcon(kind: IssueKind): IconName {
  return ISSUE_KIND_FACES.find((face) => face.value === kind)?.icon ?? 'hgiCheck';
}

export function issueStateLabel(state: IssueState): string {
  return ISSUE_STATE_FACES.find((face) => face.value === state)?.label ?? '백로그';
}

/** 더 손댈 것이 없는 상태인가. 끝난 것과 접은 것이 여기 든다. */
export function isSettled(issue: IssueSummary): boolean {
  return issue.state === ISSUE_STATES.completed || issue.state === ISSUE_STATES.canceled;
}

/**
 * 주소가 들고 온 상태 거르개를 읽는다.
 *
 * <p>비어 있으면 끝난 것과 접은 것을 감춘다. 목록을 열었을 때 눈에 먼저 들어와야 하는 것은 남은
 * 일이다.
 */
export function toStateFilter(raw: string | undefined): readonly IssueState[] {
  if (raw === undefined || raw === '') return LIVE_STATES;
  if (raw === 'all') return ISSUE_STATE_FACES.map((face) => face.value);

  const known = new Set<string>(ISSUE_STATE_FACES.map((face) => face.value));
  const picked = raw
    .split(',')
    .map((piece) => piece.trim().toUpperCase())
    .filter((piece): piece is IssueState => known.has(piece));

  return picked.length > 0 ? picked : LIVE_STATES;
}

/** 주소가 들고 온 유형 거르개를 읽는다. 비어 있으면 전부를 뜻한다. */
export function toKindFilter(raw: string | undefined): readonly IssueKind[] {
  if (raw === undefined || raw === '') return ISSUE_KIND_FACES.map((face) => face.value);

  const known = new Set<string>(ISSUE_KIND_FACES.map((face) => face.value));
  const picked = raw
    .split(',')
    .map((piece) => piece.trim().toUpperCase())
    .filter((piece): piece is IssueKind => known.has(piece));

  return picked.length > 0 ? picked : ISSUE_KIND_FACES.map((face) => face.value);
}

/** 거르개 하나를 켜고 끈 결과를 주소에 실을 문자열로 만든다. 전부 켜지면 비운다. */
export function toggleFilter<T extends string>(
  current: readonly T[],
  all: readonly T[],
  value: T,
): string | null {
  const next = current.includes(value)
    ? current.filter((piece) => piece !== value)
    : [...current, value];

  if (next.length === 0 || next.length === all.length) return null;
  return all.filter((piece) => next.includes(piece)).join(',');
}

/**
 * 부모 아래에 자식이 붙도록 줄을 세운다.
 *
 * <p>부모가 걸러져 사라져도 자식은 남는다. 자식이 제 부모를 잃으면 뿌리로 올라와 제 자리에 선다.
 */
export function orderByHierarchy(issues: readonly IssueSummary[]): readonly IssueSummary[] {
  const present = new Set(issues.map((issue) => issue.id));
  const roots = issues.filter((issue) => issue.parentId === null || !present.has(issue.parentId));
  const byId = (left: IssueSummary, right: IssueSummary) => left.id.localeCompare(right.id);

  return [...roots].sort(byId).flatMap((root) => [
    root,
    ...issues.filter((issue) => issue.parentId === root.id).sort(byId),
  ]);
}

/** 이 줄이 자식으로 들여써지는가. 부모가 같은 목록에 함께 있을 때만 들여쓴다. */
export function isNested(issue: IssueSummary, issues: readonly IssueSummary[]): boolean {
  return issue.parentId !== null && issues.some((other) => other.id === issue.parentId);
}

export function matchesFilter(
  issue: IssueSummary,
  kinds: readonly IssueKind[],
  states: readonly IssueState[],
): boolean {
  return kinds.includes(issue.kind) && states.includes(issue.state);
}
