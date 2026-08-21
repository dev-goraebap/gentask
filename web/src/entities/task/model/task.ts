/**
 * 할일 하나입니다.
 *
 * 프로토타입 구간의 이 타입 정의가 이후 백엔드 스펙의 API 계약 입력이 됩니다.
 * 백엔드가 붙으면 생성 타입이 이 자리를 대체하며, 그때 이 모양과 생성 타입의 차이가
 * 곧 스펙 누락 목록입니다. docs/architecture/references/14-api-contract.md 4절.
 *
 * 완료 여부를 boolean 이 아니라 시각으로 두는 이유는 "언제 해냈는가"가 완료 목록의
 * 정렬 근거이고, boolean 으로 두면 그 정보를 나중에 되살릴 수 없기 때문입니다.
 */
export type Task = {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly completedAt: string | null;

  /** 제목만으로는 담기지 않는 맥락입니다. 비어 있는 것이 기본 상태입니다. */
  readonly note: string;

  /**
   * 마감일입니다. `YYYY-MM-DD` 이며 정하지 않은 것이 기본 상태입니다.
   *
   * 시각을 담지 않는 이유는 마감 시각이 알림과 묶이는 값이고 알림이 이 스펙의 범위
   * 밖이기 때문입니다. 시각을 두면 어느 시간대로 판정할지가 따라오는데, 그 판단은
   * 요구사항이 확정되지 않은 상태에서 데이터 형식만 먼저 굳히게 됩니다.
   *
   * 날짜만 두면 사전순 비교가 곧 시간순 비교라 정렬과 지난 마감일 판정에 별도 변환이
   * 필요 없습니다. ISO 8601 의 날짜 부분이 그 성질을 갖습니다.
   */
  readonly dueDate: string | null;

  /** 지금 신경 써야 하는 항목이라는 표시입니다. TK-003 A4. */
  readonly important: boolean;

  /**
   * 내 하루에 담은 날짜입니다. `YYYY-MM-DD` 이며 담지 않은 것이 기본 상태입니다.
   *
   * 담김을 boolean 이 아니라 날짜로 두는 이유는 담긴 것이 매일 비워져야 하기 때문입니다.
   * 날짜를 들고 있으면 오늘과 비교하는 것만으로 비워지므로, 자정에 값을 지우러 다니는
   * 장치를 따로 두지 않아도 됩니다. 하루의 경계 판정은 TK-002 의 미결 항목입니다.
   */
  readonly myDayOn: string | null;
};

export function isCompleted(task: Task): boolean {
  return task.completedAt !== null;
}

/**
 * 사용자가 고를 수 있는 미완료 목록의 정렬 기준입니다.
 *
 * 방향을 함께 두지 않습니다. 기준마다 쓸모 있는 방향이 하나로 정해지기 때문입니다.
 * 마감일은 가까운 것부터 봐야 하고, 추가한 순서는 방금 적은 것부터 봐야 합니다.
 * 뒤집을 수단이 필요해지면 그때 08-routing.md 3절에 따라 방향도 주소에 둡니다.
 */
export type TaskSort = 'created' | 'due';

/**
 * 주소에서 온 값을 정렬 기준으로 좁힙니다.
 *
 * 알 수 없는 값은 기본값으로 되돌립니다. 사용자가 주소를 직접 고쳤을 때 화면이 비거나
 * 깨지는 대신 기본 정렬로 뜨는 편이 낫습니다.
 */
export function toTaskSort(raw: string | undefined | null): TaskSort {
  return raw === 'due' ? 'due' : 'created';
}

/**
 * 완료 여부로만 가릅니다. 순서는 정렬 함수가 정합니다.
 *
 * 분류와 정렬을 나눈 이유는 정렬 기준이 사용자가 고르는 값이 되었기 때문입니다.
 * 한 함수가 둘을 다 가지면 기준이 늘 때마다 분류 코드까지 다시 읽어야 합니다.
 */
export function splitByCompletion(tasks: readonly Task[]): {
  readonly active: readonly Task[];
  readonly completed: readonly Task[];
} {
  return {
    active: tasks.filter((task) => !isCompleted(task)),
    completed: tasks.filter(isCompleted),
  };
}

/**
 * 미완료 목록의 순서를 정합니다.
 *
 * 마감일 기준에서 정하지 않은 항목은 뒤로 보냅니다. 마감일이 없는 것은 늦은 것이 아니라
 * 기한이 없는 것이므로 가장 먼 날짜로 취급하면 어긋납니다. 그 안에서는 기본 기준인
 * 추가 순서를 따릅니다.
 *
 * 사전순 비교가 곧 시간순 비교입니다. `createdAt` 은 ISO 8601 이고 `dueDate` 는 그
 * 날짜 부분이라 둘 다 별도 변환이 필요 없습니다.
 */
export function sortActive(tasks: readonly Task[], by: TaskSort): readonly Task[] {
  const byCreated = (a: Task, b: Task) => b.createdAt.localeCompare(a.createdAt);

  if (by === 'created') return [...tasks].sort(byCreated);

  return [...tasks].sort((a, b) => {
    if (a.dueDate === null && b.dueDate === null) return byCreated(a, b);
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;

    const byDue = a.dueDate.localeCompare(b.dueDate);
    return byDue !== 0 ? byDue : byCreated(a, b);
  });
}

/**
 * 완료 목록의 순서입니다. 최근에 해낸 것이 위로 옵니다.
 *
 * 사용자가 고르지 않습니다. 완료 목록은 해낸 것을 확인하는 자리라 시간 역순 외의
 * 기준이 쓸모를 갖지 않습니다.
 */
export function sortCompleted(tasks: readonly Task[]): readonly Task[] {
  return [...tasks].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
}

/**
 * 같은 할일을 목적에 따라 다르게 묶어 보는 자리입니다. TK-002 A1–A4.
 *
 * 한 항목이 여러 관점에 동시에 나타납니다. 관점은 항목을 소유하지 않고 고르기만 합니다.
 */
export type TaskView = 'all' | 'my-day' | 'important' | 'planned';

/**
 * 화면에 나열할 관점입니다. 순서가 곧 사이드바의 순서입니다.
 *
 * 이 목록이 엔티티에 있는 이유는 읽는 쪽이 둘이기 때문입니다. 셸의 네비게이션과 목록
 * 화면의 제목이 같은 이름을 써야 하며, 둘이 함께 참조할 수 있는 아래 계층이 여기입니다.
 * 아이콘은 표현이므로 셸이 갖습니다. 02-package-structure.md 5절.
 */
export const TASK_VIEWS: readonly { readonly value: TaskView; readonly label: string }[] = [
  { value: 'my-day', label: '내 하루' },
  { value: 'important', label: '중요' },
  { value: 'planned', label: '계획된 일정' },
  { value: 'all', label: '작업' },
];

/** 관점의 이름입니다. 화면 제목과 네비게이션이 같은 값을 씁니다. */
export function taskViewLabel(view: TaskView): string {
  return TASK_VIEWS.find((candidate) => candidate.value === view)?.label ?? '작업';
}

/**
 * 주소에서 온 값을 관점으로 좁힙니다.
 *
 * 알 수 없는 값은 전체로 되돌립니다. 사용자가 주소를 직접 고쳤을 때 화면이 비는 대신
 * 전체 목록이 뜨는 편이 낫습니다. 정렬 기준과 같은 처리입니다.
 */
export function toTaskView(raw: string | undefined | null): TaskView {
  return raw === 'my-day' || raw === 'important' || raw === 'planned' ? raw : 'all';
}

/** 오늘 담긴 것인지 봅니다. 어제 담은 것은 오늘의 내 하루가 아닙니다. */
export function isInMyDay(task: Task, today: string): boolean {
  return task.myDayOn === today;
}

/**
 * 관점이 고르는 항목만 남깁니다. 완료 여부로 가르는 것은 이 다음 단계입니다.
 *
 * 계획된 일정만 완료하지 않은 것으로 한정합니다. 마감일은 아직 해내지 않은 것을 언제까지
 * 해야 하는가의 값이라 해낸 뒤에는 판단 대상이 아닙니다. 나머지 셋에서 완료 항목이
 * 어떻게 보이는지는 TK-002 의 미결 항목입니다.
 */
export function filterByView(
  tasks: readonly Task[],
  view: TaskView,
  today: string,
): readonly Task[] {
  switch (view) {
    case 'my-day':
      return tasks.filter((task) => isInMyDay(task, today));
    case 'important':
      return tasks.filter((task) => task.important);
    case 'planned':
      return tasks.filter((task) => task.dueDate !== null && !isCompleted(task));
    case 'all':
      return tasks;
  }
}

/** 제목만 있으면 추가할 수 있습니다. 공백만 입력한 것은 제목이 아닙니다. */
export function isAddableTitle(raw: string): boolean {
  return raw.trim().length > 0;
}

/**
 * 마감일을 화면에 적을 형태로 바꿉니다.
 *
 * 저장 형식(`YYYY-MM-DD`)과 표시 형식을 분리합니다. 저장 형식은 정렬과 비교의 근거이고
 * 표시 형식은 읽는 사람의 것이라 둘을 같은 값으로 두면 한쪽이 다른 쪽에 끌려갑니다.
 *
 * 연도는 올해가 아닐 때만 적습니다. 대부분의 마감일이 올해에 몰리므로 매번 적으면
 * 네 글자가 모든 줄에서 같은 값을 반복합니다.
 */
export function formatDueDate(dueDate: string, today: Date = new Date()): string {
  const [year, month, day] = dueDate.split('-').map(Number);
  if (!year || !month || !day) return dueDate;

  return year === today.getFullYear() ? `${month}월 ${day}일` : `${year}년 ${month}월 ${day}일`;
}

/** 오늘 기준으로 마감일이 지났는지 봅니다. 사전순 비교가 곧 시간순 비교입니다. */
export function isOverdue(task: Task, today: string): boolean {
  return task.dueDate !== null && !isCompleted(task) && task.dueDate < today;
}

/** 오늘 날짜를 저장 형식으로 만듭니다. 지역 시각 기준이며 사용자가 보는 달력과 같습니다. */
export function toDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * 저장 형식을 달력이 다루는 값으로 되돌립니다.
 *
 * `new Date('2026-08-25')` 를 쓰지 않습니다. 그 형태는 UTC 자정으로 해석되어 한국처럼
 * 동쪽으로 치우친 시간대에서는 지역 날짜가 하루 앞당겨집니다. 사용자가 고른 날과
 * 화면에 뜨는 날이 어긋나는 종류의 결함이라 눈으로 발견하기 어렵습니다.
 */
export function fromDateKey(dueDate: string): Date | null {
  const [year, month, day] = dueDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}
