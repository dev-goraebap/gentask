import { InjectionToken } from '@angular/core';
import {
  lucideBellOff,
  lucideCalendarRange,
  lucideHouse,
  lucideStar,
  lucideSun,
  lucideUsers,
} from '@ng-icons/lucide';
import { TASK_VIEWS, type TaskView } from '@/entities/task';
import { ROUTES } from '@/shared/config';

export interface NavItem {
  readonly label: string;
  readonly icon: string;
  readonly link: string;
}

export const NAV_ICONS = {
  lucideBellOff,
  lucideCalendarRange,
  lucideHouse,
  lucideStar,
  lucideSun,
  lucideUsers,
};

const TASK_ICONS: Record<TaskView, string> = {
  'my-day': 'lucideSun',
  important: 'lucideStar',
  planned: 'lucideCalendarRange',
  all: 'lucideHouse',
};

export const NAV_ITEMS = new InjectionToken<readonly NavItem[]>('NAV_ITEMS', {
  factory: () =>
    TASK_VIEWS.map((view) => ({
      label: view.label,
      icon: TASK_ICONS[view.value],
      link: ROUTES.taskList(view.value),
    })),
});

/**
 * 껍데기가 어느 자리를 그리고 있는가.
 *
 * <p>레이아웃은 하나이고 그 안의 메뉴 구성만 다르다. 껍데기가 경로를 직접 읽지 않는 것은 라우팅의
 * 모양이 바뀔 때마다 레이아웃을 고치게 되기 때문이며, 라우트가 자기 자리를 선언해 내려 준다.
 */
export type ShellArea = 'tasks' | 'admin';

export const SHELL_AREA = new InjectionToken<ShellArea>('SHELL_AREA', {
  factory: () => 'tasks',
});

/** 관리 자리의 메뉴. 사용자 자리의 것과 겹치지 않는다. */
export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { label: '사용자 관리', icon: 'lucideUsers', link: ROUTES.adminUsers() },
  { label: '알림 문제', icon: 'lucideBellOff', link: ROUTES.adminNotifications() },
];
