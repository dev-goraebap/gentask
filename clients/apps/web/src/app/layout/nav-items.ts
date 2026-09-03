import { computed, InjectionToken, signal, type Signal, type Type } from '@angular/core';
import { TASK_VIEWS } from '@/entities/task';
import {
  MORE_NAV_ITEMS,
  type NavGroup,
  type NavItem,
  PROJECTS_NAV_ITEM,
  ROUTES,
  TODO_BOTTOM_NAV,
  trackerNavGroups,
} from '@/shared/config';

export type { NavGroup, NavItem };

/**
 * 네비게이션 사이드바 및 탭 바에 바인딩되는 반응형 메뉴 시그널이다.
 */
export const NAV_GROUPS = new InjectionToken<Signal<readonly NavGroup[]>>('NAV_GROUPS', {
  factory: () =>
    signal<readonly NavGroup[]>([
      {
        label: '작업',
        items: TASK_VIEWS.map((view) => ({
          label: view.label,
          icon: view.icon,
          link: ROUTES.taskList(view.value),
        })),
      },
      // 프로젝트는 할 일과 갈래가 다르므로 이름 없는 묶음으로 사이에 선다.
      { items: [PROJECTS_NAV_ITEM] },
      {
        label: '더보기',
        items: MORE_NAV_ITEMS,
      },
    ]),
});

/**
 * 모바일 하단 탭 바에 표시할 네비게이션 아이템 목록이다.
 */
export const BOTTOM_NAV = new InjectionToken<Signal<readonly NavItem[] | null>>('BOTTOM_NAV', {
  factory: () => signal(TODO_BOTTOM_NAV),
});

/**
 * 현재 활성화된 네비게이션 컨텍스트를 식별한다.
 */
export type ShellArea = 'tasks' | 'admin' | 'tracker';

export const SHELL_AREA = new InjectionToken<ShellArea>('SHELL_AREA', {
  factory: () => 'tasks',
});

/**
 * 네비게이션 사이드바 상단에 배치되는 컴포넌트 타입이다.
 */
export const SIDEBAR_LEAD = new InjectionToken<Type<unknown> | null>('SIDEBAR_LEAD', {
  factory: () => null,
});

/** 관리자 화면 전용 네비게이션 메뉴 목록이다. */
const ADMIN_GROUPS: readonly NavGroup[] = [
  {
    items: [
      { label: '사용자 관리', icon: 'hgiUsers', link: ROUTES.adminUsers() },
      { label: '알림 문제', icon: 'hgiNotificationOff', link: ROUTES.adminNotifications() },
    ],
  },
];

export const ADMIN_NAV_GROUPS: Signal<readonly NavGroup[]> = signal(ADMIN_GROUPS);

/** 활성 프로젝트 ID 변경에 반응하는 트래커 네비게이션 메뉴 연산 시그널이다. */
export function trackerNavGroupsSignal(projectId: Signal<string>): Signal<readonly NavGroup[]> {
  return computed(() => trackerNavGroups(projectId()));
}
