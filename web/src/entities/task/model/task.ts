/**
 * 작업 하나입니다.
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
   * 기한입니다. `YYYY-MM-DD` 이며 정하지 않은 것이 기본 상태입니다.
   *
   * 시각을 담지 않는 이유는 마감 시각이 알림과 묶이는 값이고 알림이 이 스펙의 범위
   * 밖이기 때문입니다. 시각을 두면 어느 시간대로 판정할지가 따라오는데, 그 판단은
   * 요구사항이 확정되지 않은 상태에서 데이터 형식만 먼저 굳히게 됩니다.
   *
   * 날짜만 두면 사전순 비교가 곧 시간순 비교라 정렬과 지난 기한 판정에 별도 변환이
   * 필요 없습니다. ISO 8601 의 날짜 부분이 그 성질을 갖습니다.
   */
  readonly dueDate: string | null;

  /** 지금 신경 써야 하는 항목이라는 표시입니다. TK-003 A4. */
  readonly important: boolean;

  /**
   * 나의 하루에 담은 날짜입니다. `YYYY-MM-DD` 이며 담지 않은 것이 기본 상태입니다.
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
 * 사용자가 고를 수 있는 미완료 목록의 정렬 기준입니다. TK-002 A6.
 *
 * MS To Do 와 같은 다섯입니다. 기준마다 자연스러운 방향이 하나 있어 그것을 기본으로
 * 두되, 같은 기준을 다시 고르면 뒤집을 수 있습니다. 방향은 주소가 갖습니다.
 * 08-routing.md 3절.
 */
export type TaskSort = 'created' | 'due' | 'importance' | 'my-day' | 'title';

export type SortDirection = 'asc' | 'desc';

/**
 * 기준마다의 기본 방향입니다.
 *
 * 기한 · 제목 · 만든 날짜는 작은 것이 앞이고, 중요도와 나의 하루에 추가됨는 표시된 것이 앞입니다.
 * 만든 날짜만 예외로 최근 것이 앞입니다. 방금 적은 것을 바로 보기 위해서입니다.
 */
export const DEFAULT_DIRECTION: Record<TaskSort, SortDirection> = {
  created: 'desc',
  due: 'asc',
  importance: 'desc',
  'my-day': 'desc',
  title: 'asc',
};

export const TASK_SORTS: readonly { readonly value: TaskSort; readonly label: string }[] = [
  { value: 'created', label: '만든 날짜' },
  { value: 'importance', label: '중요도' },
  { value: 'due', label: '기한' },
  { value: 'my-day', label: '나의 하루에 추가됨' },
  { value: 'title', label: '제목' },
];

/**
 * 주소에서 온 값을 정렬 기준으로 좁힙니다.
 *
 * 알 수 없는 값은 기본값으로 되돌립니다. 사용자가 주소를 직접 고쳤을 때 화면이 비거나
 * 깨지는 대신 기본 정렬로 뜨는 편이 낫습니다.
 */
export function toTaskSort(raw: string | undefined | null): TaskSort {
  return TASK_SORTS.some((s) => s.value === raw) ? (raw as TaskSort) : 'created';
}

/** 주소에서 온 방향을 좁힙니다. 알 수 없으면 그 기준의 기본 방향입니다. */
export function toSortDirection(raw: string | undefined | null, by: TaskSort): SortDirection {
  return raw === 'asc' || raw === 'desc' ? raw : DEFAULT_DIRECTION[by];
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
 * 기준 값이 없는 항목(기한 없음, 나의 하루에 추가되지 않음)은 방향과 무관하게 뒤로 보냅니다.
 * 없는 것은 작은 것이 아니라 없는 것이므로 극값으로 취급하면 방향을 뒤집을 때 맨 앞으로
 * 올라옵니다. 같은 값끼리는 만든 날짜 최근 것이 앞입니다.
 *
 * 사전순 비교가 곧 시간순 비교입니다. `createdAt` 은 ISO 8601 이고 `dueDate` 와 `myDayOn` 은
 * 그 날짜 부분이라 별도 변환이 필요 없습니다. 제목만 로캘 비교를 씁니다.
 */
export function sortActive(
  tasks: readonly Task[],
  by: TaskSort,
  direction: SortDirection = DEFAULT_DIRECTION[by],
): readonly Task[] {
  const byCreated = (a: Task, b: Task) => b.createdAt.localeCompare(a.createdAt);
  const sign = direction === 'asc' ? 1 : -1;

  const key = (t: Task): string | number | null => {
    switch (by) {
      case 'created':
        return t.createdAt;
      case 'due':
        return t.dueDate;
      case 'my-day':
        return t.myDayOn;
      case 'importance':
        return t.important ? 1 : 0;
      case 'title':
        return t.title;
    }
  };

  return [...tasks].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka === null && kb === null) return byCreated(a, b);
    if (ka === null) return 1;
    if (kb === null) return -1;

    const cmp =
      typeof ka === 'number' && typeof kb === 'number'
        ? ka - kb
        : by === 'title'
          ? String(ka).localeCompare(String(kb), 'ko')
          : String(ka).localeCompare(String(kb));
    return cmp !== 0 ? cmp * sign : byCreated(a, b);
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
 * 같은 작업을 목적에 따라 다르게 묶어 보는 자리입니다. TK-002 A1–A4.
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
  { value: 'my-day', label: '나의 하루' },
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

/** 나의 하루에 추가긴 것인지 봅니다. 어제 담은 것은 오늘의 나의 하루가 아닙니다. */
export function isInMyDay(task: Task, today: string): boolean {
  return task.myDayOn === today;
}

/**
 * 관점이 고르는 항목만 남깁니다. 완료 여부로 가르는 것은 이 다음 단계입니다.
 *
 * 계획된 일정만 완료하지 않은 것으로 한정합니다. 기한은 아직 해내지 않은 것을 언제까지
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
 * 기한을 화면에 적을 형태로 바꿉니다.
 *
 * 저장 형식(`YYYY-MM-DD`)과 표시 형식을 분리합니다. 저장 형식은 정렬과 비교의 근거이고
 * 표시 형식은 읽는 사람의 것이라 둘을 같은 값으로 두면 한쪽이 다른 쪽에 끌려갑니다.
 *
 * 연도는 올해가 아닐 때만 적습니다. 대부분의 기한이 올해에 몰리므로 매번 적으면
 * 네 글자가 모든 줄에서 같은 값을 반복합니다.
 */
export function formatDueDate(dueDate: string, today: Date = new Date()): string {
  const [year, month, day] = dueDate.split('-').map(Number);
  if (!year || !month || !day) return dueDate;

  return year === today.getFullYear() ? `${month}월 ${day}일` : `${year}년 ${month}월 ${day}일`;
}

/**
 * 기한을 "~까지" 로 읽어 줍니다. MS To Do 의 표기입니다. 오늘과 내일은 날짜 대신 말로 적습니다.
 * 오늘을 인자로 받는 이유는 화면과 테스트가 같은 기준일을 쓰게 하기 위해서입니다.
 */
export function describeDue(dueDate: string, today: string): string {
  if (dueDate === today) return '오늘까지';
  if (dueDate === shiftDateKey(today, 1)) return '내일까지';
  return `${formatDueDate(dueDate)}까지`;
}

/**
 * 목록 행에 적는 짧은 기한입니다. 오늘 · 내일은 말로, 나머지는 날짜와 요일로 적습니다.
 * MS To Do 의 목록 표기입니다.
 */
export function describeDueBrief(dueDate: string, today: string): string {
  if (dueDate === today) return '오늘';
  if (dueDate === shiftDateKey(today, 1)) return '내일';
  const date = fromDateKey(dueDate);
  const weekday = date ? ` ${date.toLocaleDateString('ko-KR', { weekday: 'short' })}` : '';
  return `${formatDueDate(dueDate)}${weekday}`;
}

/** 날짜 키에 일수를 더합니다. 지역 시각 기준이며 달력과 같은 규칙입니다. */
export function shiftDateKey(key: string, days: number): string {
  const date = fromDateKey(key);
  if (!date) return key;
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** 오늘 기준으로 기한이 지났는지 봅니다. 사전순 비교가 곧 시간순 비교입니다. */
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
