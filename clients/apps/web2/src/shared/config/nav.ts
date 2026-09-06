import type { IconType } from '@astryxdesign/core';
import {
  BellOff,
  Book,
  CalendarRange,
  Cat,
  CircleCheck,
  Layers,
  Settings,
  Star,
  Sun,
  Timer,
  User,
  Users,
} from 'lucide-react';
import { ROUTES } from './routes';

export interface NavItem {
  readonly label: string;
  readonly link: string;
  readonly icon: IconType;
}

export interface NavGroup {
  readonly label?: string;
  readonly items: readonly NavItem[];
}

/** 작업 화면이 가르는 네 가지 관점이다. 아이콘은 Angular 의 것과 짝을 맞춘다. */
export const TASK_VIEWS = [
  { value: 'my-day', label: '나의 하루', icon: Sun },
  { value: 'important', label: '중요', icon: Star },
  { value: 'planned', label: '계획된 일정', icon: CalendarRange },
  { value: 'all', label: '할 일', icon: CircleCheck },
] as const;

export type TaskViewName = (typeof TASK_VIEWS)[number]['value'];

export function toTaskView(raw: string | undefined | null): TaskViewName {
  return raw === 'my-day' || raw === 'important' || raw === 'planned' ? raw : 'all';
}

export function taskViewLabel(view: TaskViewName): string {
  return TASK_VIEWS.find((candidate) => candidate.value === view)?.label ?? '할 일';
}

/**
 * 작업 밖의 자리들. 넓은 화면의 사이드바와 좁은 화면의 더보기가 함께 쓴다.
 */
export const MORE_NAV_ITEMS: readonly NavItem[] = [
  { label: '팻 관리', link: ROUTES.pets(), icon: Cat },
  { label: '뽀모도로', link: ROUTES.pomodoro(), icon: Timer },
];

/**
 * 좁은 화면의 더보기가 여는 것들.
 *
 * 바닥의 띠에는 자주 오가는 것만 두고 나머지가 이 자리로 온다. 계정이 여기 있는 것은 그것이
 * 영역에 매이지 않기 때문이며, 띠에 넣으면 영역마다 한 칸을 그것에 내주게 된다.
 */
export const MORE_SHEET_ITEMS: readonly NavItem[] = [
  ...MORE_NAV_ITEMS,
  { label: '계정', link: ROUTES.account(), icon: User },
];

export const PROJECTS_NAV_ITEM: NavItem = {
  label: '프로젝트',
  link: ROUTES.projects(),
  icon: Layers,
};

/** 개인 영역의 메뉴다. */
export const PERSONAL_NAV_GROUPS: readonly NavGroup[] = [
  {
    label: '작업',
    items: TASK_VIEWS.map((view) => ({
      label: view.label,
      link: ROUTES.taskList(view.value),
      icon: view.icon,
    })),
  },
  // 프로젝트는 할 일과 갈래가 다르므로 이름 없는 묶음으로 사이에 선다.
  { items: [PROJECTS_NAV_ITEM] },
  {
    label: '더보기',
    items: [...MORE_NAV_ITEMS, { label: '계정', link: ROUTES.account(), icon: User }],
  },
];

/**
 * 좁은 화면 아래에 깔리는 띠. 자주 오가는 것만 두고 나머지는 드로어가 갖는다.
 * 넷을 넘기면 한 칸이 좁아져 글자가 줄어든다.
 */
export const TODO_BOTTOM_NAV: readonly NavItem[] = [
  { label: '작업', link: ROUTES.taskList('my-day'), icon: CircleCheck },
  PROJECTS_NAV_ITEM,
];

export function trackerBottomNav(projectId: string): readonly NavItem[] {
  return [
    { label: '작업 아이템', link: ROUTES.issues(projectId), icon: Layers },
    { label: '문서', link: ROUTES.docs(projectId), icon: Book },
  ];
}

/** 관리 영역의 메뉴다. */
export const ADMIN_NAV_GROUPS: readonly NavGroup[] = [
  {
    items: [
      { label: '사용자 관리', link: ROUTES.adminUsers(), icon: Users },
      { label: '알림 문제', link: ROUTES.adminNotifications(), icon: BellOff },
    ],
  },
];

/** 트래커 영역의 메뉴다. 활성 프로젝트에 따라 링크가 달라진다. */
export function trackerNavGroups(projectId: string): readonly NavGroup[] {
  return [
    {
      // 개인 영역과 명칭을 맞춘다.
      label: '작업',
      items: [
        { label: '작업 아이템', link: ROUTES.issues(projectId), icon: Layers },
        { label: '문서', link: ROUTES.docs(projectId), icon: Book },
      ],
    },
    {
      label: '관리',
      items: [{ label: '프로젝트 설정', link: ROUTES.projectSettings(projectId), icon: Settings }],
    },
  ];
}
