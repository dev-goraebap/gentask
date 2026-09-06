import { TODAY } from '@/shared/config';

export interface TaskFile {
  readonly id: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
  readonly createdAt: string;
}

export interface Task {
  readonly id: string;
  title: string;
  note: string;
  /** 기한. `YYYY-MM-DD` */
  dueDate: string | null;
  /** 알림 예약 시각. `YYYY-MM-DDTHH:mm` */
  remindAt: string | null;
  important: boolean;
  /** 나의 하루에 추가한 날짜. 그 날짜가 오늘과 같을 때만 나의 하루에 나타난다. */
  myDayOn: string | null;
  completedAt: string | null;
  readonly createdAt: string;
  files: TaskFile[];
}

export type TaskViewKey = 'my-day' | 'important' | 'planned' | 'all';

export interface TaskViewItem {
  readonly value: TaskViewKey;
  readonly label: string;
}

export const TASK_VIEWS: readonly TaskViewItem[] = [
  { value: 'my-day', label: '나의 하루' },
  { value: 'important', label: '중요' },
  { value: 'planned', label: '계획된 일정' },
  { value: 'all', label: '할 일' },
];

export function toTaskView(raw: string | undefined | null): TaskViewKey {
  return raw === 'my-day' || raw === 'important' || raw === 'planned' ? raw : 'all';
}

export function isCompleted(task: Task): boolean {
  return task.completedAt !== null;
}

export function filterByView(
  tasks: readonly Task[],
  view: TaskViewKey,
  today: string,
): readonly Task[] {
  switch (view) {
    case 'my-day':
      return tasks.filter((t) => t.myDayOn === today);
    case 'important':
      return tasks.filter((t) => t.important);
    case 'planned':
      return tasks.filter((t) => t.dueDate !== null && !isCompleted(t));
    case 'all':
      return tasks;
  }
}

export function splitByCompletion(tasks: readonly Task[]): {
  readonly active: readonly Task[];
  readonly completed: readonly Task[];
} {
  return {
    active: tasks.filter((t) => !isCompleted(t)),
    completed: tasks.filter(isCompleted),
  };
}

export type TaskSort = 'created' | 'due' | 'importance' | 'my-day' | 'title';

export const TASK_SORTS: readonly { readonly value: TaskSort; readonly label: string }[] = [
  { value: 'created', label: '만든 날짜' },
  { value: 'due', label: '기한' },
  { value: 'importance', label: '중요도' },
  { value: 'my-day', label: '나의 하루에 추가됨' },
  { value: 'title', label: '제목' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'T1',
    title: '도커 이미지 릴리스 태그 규칙 정리',
    note: 'rc 태그와 정식 태그를 같은 커밋에 붙이는 절차를 문서로 남긴다.',
    dueDate: '2026-09-06',
    remindAt: '2026-09-06T09:00',
    important: true,
    myDayOn: TODAY,
    completedAt: null,
    createdAt: '2026-09-04T10:12',
    files: [],
  },
  {
    id: 'T2',
    title: '홈서버 디스크 용량 확인',
    note: '',
    dueDate: null,
    remindAt: null,
    important: false,
    myDayOn: TODAY,
    completedAt: null,
    createdAt: '2026-09-05T21:40',
    files: [],
  },
  {
    id: 'T3',
    title: '치과 예약 데모 영상 녹화',
    note: '',
    dueDate: '2026-09-05',
    remindAt: null,
    important: false,
    myDayOn: null,
    completedAt: '2026-09-05T18:02',
    createdAt: '2026-09-02T09:00',
    files: [],
  },
  {
    id: 'T4',
    title: '오픈소스 라이선스 표기 점검',
    note: 'Unbounded 는 OFL, Huge Icons 는 무료 세트다. 표기 위치를 정한다.',
    dueDate: '2026-09-12',
    remindAt: null,
    important: true,
    myDayOn: null,
    completedAt: null,
    createdAt: '2026-09-01T14:20',
    files: [
      {
        id: 'F1',
        fileName: '라이선스-정리.md',
        contentType: 'text/markdown',
        size: 3120,
        createdAt: '2026-09-01T14:25',
      },
    ],
  },
  {
    id: 'T5',
    title: '초대 링크 구현 방식 조사',
    note: '',
    dueDate: '2026-09-20',
    remindAt: null,
    important: false,
    myDayOn: null,
    completedAt: null,
    createdAt: '2026-08-30T11:05',
    files: [],
  },
];
