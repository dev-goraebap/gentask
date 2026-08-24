// 관점을 뜻하는 TaskView 가 이 파일에 이미 있습니다.
import type { TaskView as TaskResponse } from '@/shared/api';

/**
 * 기한은 `YYYY-MM-DD`, 미리 알림은 `YYYY-MM-DDTHH:mm` 이고 시간대 지정자가 없습니다.
 * 둘 다 사전순 비교가 곧 시간순 비교입니다. 07-api-design.md 3절.
 */
export type Task = TaskResponse;

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

/** 메뉴의 이름과, 고른 뒤 칩에 적는 문구입니다. 문구는 MS To Do 를 따릅니다. */
export const TASK_SORTS: readonly {
  readonly value: TaskSort;
  readonly label: string;
  readonly chip: string;
}[] = [
  { value: 'importance', label: '중요도', chip: '중요도로 정렬' },
  { value: 'due', label: '기한', chip: '기한으로 정렬' },
  { value: 'my-day', label: '나의 하루에 추가됨', chip: '나의 하루 추가 여부로 정렬' },
  { value: 'title', label: '제목', chip: '제목으로 정렬' },
  { value: 'created', label: '만든 날짜', chip: '만든 날짜로 정렬' },
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

/**
 * 미리 알림에서 날짜 부분만 뗍니다. 달력에 넘기거나 오늘과 견줄 때 씁니다.
 * 두 값이 같은 규칙이라 자르는 것으로 충분하며 파싱이 필요 없습니다.
 */
export function remindDateKey(remindAt: string): string {
  return remindAt.slice(0, 10);
}

/** 미리 알림에서 시각 부분만 뗍니다. `HH:mm` 입니다. */
export function remindTimeKey(remindAt: string): string {
  return remindAt.slice(11, 16);
}

/**
 * 시각을 화면에 적을 형태로 바꿉니다. `09:00` 이 `오전 9:00` 이 됩니다.
 *
 * `toLocaleTimeString` 을 쓰지 않습니다. 그 결과는 실행 환경의 로캘 데이터에 따라 달라져
 * 테스트가 개발자 기계에서만 통과하는 종류의 차이를 만듭니다. 형식이 하나뿐이라 직접 만듭니다.
 */
export function formatTimeOfDay(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;

  const meridiem = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${meridiem} ${hour12}:${`${minute}`.padStart(2, '0')}`;
}

/**
 * 미리 알림을 짧게 읽어 줍니다. 오늘이면 시각만, 내일이면 말과 시각, 나머지는 날짜와 시각입니다.
 * 오늘의 알림에 "오늘" 을 붙이지 않는 이유는 그 줄에서 가장 자주 나오는 값이 오늘이고,
 * 매번 같은 두 글자가 반복되면 정작 다른 날인 항목이 눈에 띄지 않기 때문입니다.
 */
export function describeRemind(remindAt: string, today: string): string {
  const date = remindDateKey(remindAt);
  const time = formatTimeOfDay(remindTimeKey(remindAt));

  if (date === today) return time;
  if (date === shiftDateKey(today, 1)) return `내일 ${time}`;
  return `${formatDueDate(date)} ${time}`;
}

/**
 * 알릴 시각이 이미 지났는지 봅니다. 지난 알림은 울릴 일이 남지 않았다는 표시입니다.
 * 완료한 작업은 판단 대상이 아닙니다. 해낸 뒤에는 알릴 이유가 없습니다.
 */
export function isRemindPast(task: Task, now: string): boolean {
  return task.remindAt !== null && !isCompleted(task) && task.remindAt < now;
}

/**
 * 기한의 빠른 선택입니다. MS To Do 의 오늘 · 내일 · 다음 주와 같습니다.
 *
 * 아이콘은 두지 않습니다. 그것은 표현이고 이 계층은 값과 이름만 갖습니다. TASK_VIEWS 와
 * 같은 규칙입니다. 두 화면(적는 자리 · 상세)이 같은 함수를 거치므로 고를 수 있는 날이
 * 어긋나지 않습니다.
 */
export function quickDues(now: Date): readonly {
  readonly label: string;
  readonly date: Date;
  readonly weekday: string;
}[] {
  return [
    { label: '오늘', days: 0 },
    { label: '내일', days: 1 },
    { label: '다음 주', days: 7 },
  ].map(({ label, days }) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    return { label, date, weekday: date.toLocaleDateString('ko-KR', { weekday: 'short' }) };
  });
}

/**
 * 미리 알림의 빠른 선택입니다. MS To Do 의 오늘 나중에 · 내일 · 다음 주와 같습니다.
 *
 * "오늘 나중에" 만 지금을 기준으로 움직입니다. 세 시간 뒤의 다음 정시이며, 분을 남기지 않는
 * 이유는 사용자가 고른 것이 "이따가" 이지 특정 분이 아니기 때문입니다. 나머지 둘은 아침
 * 아홉 시로 고정입니다.
 */
export function quickReminds(now: Date): readonly {
  readonly label: string;
  readonly at: string;
  readonly hint: string;
}[] {
  const later = new Date(now);
  later.setHours(later.getHours() + LATER_HOURS, 0, 0, 0);

  const morning = (days: number): Date => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(MORNING_HOUR, 0, 0, 0);
    return date;
  };

  const tomorrow = morning(1);
  const nextWeek = morning(7);
  const weekday = (date: Date) => date.toLocaleDateString('ko-KR', { weekday: 'short' });

  return [
    {
      label: '오늘 나중에',
      at: toDateTimeKey(later),
      hint: formatTimeOfDay(remindTimeKey(toDateTimeKey(later))),
    },
    {
      label: '내일',
      at: toDateTimeKey(tomorrow),
      hint: `${weekday(tomorrow)}, ${formatTimeOfDay(`${MORNING_HOUR}`.padStart(2, '0') + ':00')}`,
    },
    {
      label: '다음 주',
      at: toDateTimeKey(nextWeek),
      hint: `${weekday(nextWeek)}, ${formatTimeOfDay(`${MORNING_HOUR}`.padStart(2, '0') + ':00')}`,
    },
  ];
}

/** 빠른 선택이 쓰는 값입니다. "오늘 나중에" 의 간격과 아침의 기준 시각입니다. */
const LATER_HOURS = 3;
const MORNING_HOUR = 9;

/**
 * 날짜만 고르고 시각을 정하지 않았을 때 쓰는 시각입니다.
 *
 * 빠른 선택의 "내일" · "다음 주" 와 같은 값입니다. 달력으로 고른 날과 빠른 선택으로 고른
 * 날이 다른 시각에 울리면 같은 조작으로 보이지 않습니다. 적는 자리와 상세가 함께 씁니다.
 */
export const DEFAULT_REMIND_TIME = `${`${MORNING_HOUR}`.padStart(2, '0')}:00`;

/**
 * 시각을 고르는 세 축입니다. 오전·오후 · 시 · 분이며 MS To Do 와 같은 구성입니다.
 *
 * 하나의 목록으로 늘어놓지 않는 이유는 간격을 정해야 하기 때문입니다. 30분 간격이면
 * 48칸이라 원하는 값까지 스크롤이 길고, 그러면서도 7시 10분 같은 값은 아예 고를 수
 * 없습니다. 세 축으로 나누면 가장 긴 축이 60칸이지만 각 축에서 한 번씩만 고르면 됩니다.
 */
export const MERIDIEMS = ['오전', '오후'] as const;

export type Meridiem = (typeof MERIDIEMS)[number];

/** 12시간제의 시입니다. 0시는 없으며 자정과 정오가 모두 12입니다. */
export const HOURS12: readonly number[] = Array.from({ length: 12 }, (_, index) => index + 1);

/** 분입니다. 두 자리 문자열로 두어 화면과 저장 형식이 같은 값을 씁니다. */
export const MINUTES: readonly string[] = Array.from({ length: 60 }, (_, index) =>
  `${index}`.padStart(2, '0'),
);

/** 저장 형식의 시각(`HH:mm`)을 세 축으로 나눕니다. */
export function splitTime(time: string): {
  readonly meridiem: Meridiem;
  readonly hour12: number;
  readonly minute: string;
} {
  const [hour, minute] = time.split(':');
  const hour24 = Number(hour);
  return {
    meridiem: hour24 < 12 ? '오전' : '오후',
    hour12: hour24 % 12 === 0 ? 12 : hour24 % 12,
    minute,
  };
}

/**
 * 세 축을 저장 형식의 시각으로 합칩니다.
 *
 * 12를 먼저 0으로 되돌린 뒤 오후에 12를 더합니다. 오전 12시가 0시이고 오후 12시가
 * 12시인데, 그 둘만 예외로 두면 분기가 넷으로 늘어납니다.
 */
export function joinTime(meridiem: Meridiem, hour12: number, minute: string): string {
  const base = hour12 % 12;
  const hour24 = meridiem === '오후' ? base + 12 : base;
  return `${`${hour24}`.padStart(2, '0')}:${minute}`;
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
 * 날짜와 시각을 미리 알림의 저장 형식으로 만듭니다. 지역 시각 기준입니다.
 * 초와 밀리초는 버립니다. 사용자가 고를 수 있는 단위가 분까지입니다.
 */
export function toDateTimeKey(date: Date): string {
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${toDateKey(date)}T${hour}:${minute}`;
}

/**
 * 미리 알림의 저장 형식을 달력이 다루는 값으로 되돌립니다.
 *
 * `new Date(key)` 를 쓰지 않습니다. 시간대 지정자가 없는 문자열의 해석은 형식에 따라
 * 갈리며, 날짜만 있는 쪽은 UTC 로 읽힙니다. 두 형식이 같은 규칙으로 읽히도록 직접 만듭니다.
 */
export function fromDateTimeKey(remindAt: string): Date | null {
  const date = fromDateKey(remindDateKey(remindAt));
  if (!date) return null;

  const [hour, minute] = remindTimeKey(remindAt).split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  date.setHours(hour, minute, 0, 0);
  return date;
}

/**
 * 날짜와 시각을 합칩니다. 한쪽만 바뀌어도 다른 쪽은 그대로 둡니다.
 * 미리 알림은 값이 하나라 달력과 시각 선택이 같은 문자열을 나눠 씁니다.
 */
export function withRemindDate(remindAt: string | null, date: Date, fallbackTime: string): string {
  return `${toDateKey(date)}T${remindAt ? remindTimeKey(remindAt) : fallbackTime}`;
}

export function withRemindTime(
  remindAt: string | null,
  time: string,
  fallbackDate: string,
): string {
  return `${remindAt ? remindDateKey(remindAt) : fallbackDate}T${time}`;
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
