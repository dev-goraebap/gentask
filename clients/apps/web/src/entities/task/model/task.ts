import type { TaskView as TaskResponse } from '@/shared/api';
import type { IconName } from '@/shared/ui/icon';

export type Task = TaskResponse;

export function isCompleted(task: Task): boolean {
  return task.completedAt !== null;
}

export type TaskSort = 'created' | 'due' | 'importance' | 'my-day' | 'title';

export type SortDirection = 'asc' | 'desc';

export const DEFAULT_DIRECTION: Record<TaskSort, SortDirection> = {
  created: 'desc',
  due: 'asc',
  importance: 'desc',
  'my-day': 'desc',
  title: 'asc',
};

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

export function toTaskSort(raw: string | undefined | null): TaskSort {
  return TASK_SORTS.some((s) => s.value === raw) ? (raw as TaskSort) : 'created';
}

export function toSortDirection(raw: string | undefined | null, by: TaskSort): SortDirection {
  return raw === 'asc' || raw === 'desc' ? raw : DEFAULT_DIRECTION[by];
}

export function splitByCompletion(tasks: readonly Task[]): {
  readonly active: readonly Task[];
  readonly completed: readonly Task[];
} {
  return {
    active: tasks.filter((task) => !isCompleted(task)),
    completed: tasks.filter(isCompleted),
  };
}

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

export function sortCompleted(tasks: readonly Task[]): readonly Task[] {
  return [...tasks].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
}

export type TaskView = 'all' | 'my-day' | 'important' | 'planned';

/** 스마트 목록 하나. 그림을 함께 두는 것은 사이드바와 목록들 화면이 같은 것을 그려야 하기 때문이다. */
export interface TaskViewItem {
  readonly value: TaskView;
  readonly label: string;
  readonly icon: IconName;
}

export const TASK_VIEWS: readonly TaskViewItem[] = [
  { value: 'my-day', label: '나의 하루', icon: 'hgiSun' },
  { value: 'important', label: '중요', icon: 'hgiStar' },
  { value: 'planned', label: '계획된 일정', icon: 'hgiCalendarRange' },
  { value: 'all', label: '할 일', icon: 'hgiHome' },
];

export function taskViewLabel(view: TaskView): string {
  return TASK_VIEWS.find((candidate) => candidate.value === view)?.label ?? '할 일';
}

export function toTaskView(raw: string | undefined | null): TaskView {
  return raw === 'my-day' || raw === 'important' || raw === 'planned' ? raw : 'all';
}

export function isInMyDay(task: Task, today: string): boolean {
  return task.myDayOn === today;
}

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

export function isAddableTitle(raw: string): boolean {
  return raw.trim().length > 0;
}

export function formatDueDate(dueDate: string, today: Date = new Date()): string {
  const [year, month, day] = dueDate.split('-').map(Number);
  if (!year || !month || !day) return dueDate;

  return year === today.getFullYear() ? `${month}월 ${day}일` : `${year}년 ${month}월 ${day}일`;
}

export function describeDue(dueDate: string, today: string): string {
  if (dueDate === today) return '오늘까지';
  if (dueDate === shiftDateKey(today, 1)) return '내일까지';
  return `${formatDueDate(dueDate)}까지`;
}

export function describeDueBrief(dueDate: string, today: string): string {
  if (dueDate === today) return '오늘';
  if (dueDate === shiftDateKey(today, 1)) return '내일';
  const date = fromDateKey(dueDate);
  const weekday = date ? ` ${date.toLocaleDateString('ko-KR', { weekday: 'short' })}` : '';
  return `${formatDueDate(dueDate)}${weekday}`;
}

export function remindDateKey(remindAt: string): string {
  return remindAt.slice(0, 10);
}

export function remindTimeKey(remindAt: string): string {
  return remindAt.slice(11, 16);
}

export function formatTimeOfDay(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;

  const meridiem = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${meridiem} ${hour12}:${`${minute}`.padStart(2, '0')}`;
}

export function describeRemind(remindAt: string, today: string): string {
  const date = remindDateKey(remindAt);
  const time = formatTimeOfDay(remindTimeKey(remindAt));

  if (date === today) return time;
  if (date === shiftDateKey(today, 1)) return `내일 ${time}`;
  return `${formatDueDate(date)} ${time}`;
}

export function isRemindPast(task: Task, now: string): boolean {
  return task.remindAt !== null && !isCompleted(task) && task.remindAt < now;
}

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

const LATER_HOURS = 3;
const MORNING_HOUR = 9;

export const DEFAULT_REMIND_TIME = `${`${MORNING_HOUR}`.padStart(2, '0')}:00`;

export const MERIDIEMS = ['오전', '오후'] as const;

export type Meridiem = (typeof MERIDIEMS)[number];

export const HOURS12: readonly number[] = Array.from({ length: 12 }, (_, index) => index + 1);

export const MINUTES: readonly string[] = Array.from({ length: 60 }, (_, index) =>
  `${index}`.padStart(2, '0'),
);

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

export function joinTime(meridiem: Meridiem, hour12: number, minute: string): string {
  const base = hour12 % 12;
  const hour24 = meridiem === '오후' ? base + 12 : base;
  return `${`${hour24}`.padStart(2, '0')}:${minute}`;
}

export function shiftDateKey(key: string, days: number): string {
  const date = fromDateKey(key);
  if (!date) return key;
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function isOverdue(task: Task, today: string): boolean {
  return task.dueDate !== null && !isCompleted(task) && task.dueDate < today;
}

export function toDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function toDateTimeKey(date: Date): string {
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${toDateKey(date)}T${hour}:${minute}`;
}

export function fromDateTimeKey(remindAt: string): Date | null {
  const date = fromDateKey(remindDateKey(remindAt));
  if (!date) return null;

  const [hour, minute] = remindTimeKey(remindAt).split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  date.setHours(hour, minute, 0, 0);
  return date;
}

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

export function fromDateKey(dueDate: string): Date | null {
  const [year, month, day] = dueDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}
