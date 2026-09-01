import { computed, InjectionToken, signal, type Signal, type Type } from '@angular/core';
import { TASK_VIEWS } from '@/entities/task';
import {
  MORE_NAV_ITEMS,
  type NavGroup,
  type NavItem,
  ROUTES,
  TODO_BOTTOM_NAV,
  trackerNavGroups,
} from '@/shared/config';

export type { NavGroup, NavItem };

/**
 * 껍데기가 그리는 메뉴.
 *
 * <p>시그널인 이유는 트래커의 메뉴가 지금 프로젝트를 담기 때문입니다. 상수로 두면 프로젝트를 바꾼
 * 뒤에도 메뉴가 앞 프로젝트를 가리킵니다.
 */
export const NAV_GROUPS = new InjectionToken<Signal<readonly NavGroup[]>>('NAV_GROUPS', {
  factory: () =>
    signal<readonly NavGroup[]>([
      {
        label: '할 일',
        items: [
          ...TASK_VIEWS.map((view) => ({
            label: view.label,
            icon: view.icon,
            link: ROUTES.taskList(view.value),
          })),
          // 메모는 목록을 거른 것이 아니라 정리 전의 자리다. 같은 갈래에 두되 뒤에 붙인다.
          { label: '메모', icon: 'hgiNote' as const, link: ROUTES.memos() },
        ],
      },
      {
        label: '더보기',
        items: MORE_NAV_ITEMS,
      },
    ]),
});

/**
 * 좁은 화면 바닥의 띠에 담기는 것.
 *
 * <p>메뉴와 따로 두는 것은 담기는 것이 다르기 때문이다. 사이드바는 그 자리의 모든 것을 늘어놓지만
 * 띠는 넷을 넘기지 못한다.
 */
export const BOTTOM_NAV = new InjectionToken<Signal<readonly NavItem[]>>('BOTTOM_NAV', {
  factory: () => signal(TODO_BOTTOM_NAV),
});

/**
 * 껍데기가 어느 자리를 그리고 있는가.
 *
 * <p>레이아웃은 하나이고 그 안의 메뉴 구성만 다르다. 껍데기가 경로를 직접 읽지 않는 것은 라우팅의
 * 모양이 바뀔 때마다 레이아웃을 고치게 되기 때문이며, 라우트가 자기 자리를 선언해 내려 준다.
 */
export type ShellArea = 'tasks' | 'admin' | 'tracker';

export const SHELL_AREA = new InjectionToken<ShellArea>('SHELL_AREA', {
  factory: () => 'tasks',
});

/**
 * 메뉴 위에 서는 컴포넌트. 없으면 메뉴가 바로 온다.
 *
 * <p>트래커 자리의 프로젝트 고르개가 이 자리를 쓴다. 껍데기가 그것을 직접 임포트하면 자리마다
 * 무엇이 서는지를 껍데기가 알게 되고, 자리가 늘 때마다 껍데기를 고치게 된다.
 */
export const SIDEBAR_LEAD = new InjectionToken<Type<unknown> | null>('SIDEBAR_LEAD', {
  factory: () => null,
});

/** 관리 자리의 메뉴. 사용자 자리의 것과 겹치지 않아 갈래가 하나뿐이며 라벨을 두지 않는다. */
const ADMIN_GROUPS: readonly NavGroup[] = [
  {
    items: [
      { label: '사용자 관리', icon: 'hgiUsers', link: ROUTES.adminUsers() },
      { label: '알림 문제', icon: 'hgiNotificationOff', link: ROUTES.adminNotifications() },
    ],
  },
];

export const ADMIN_NAV_GROUPS: Signal<readonly NavGroup[]> = signal(ADMIN_GROUPS);

/** `computed` 로 감싸므로 프로젝트를 바꾸면 메뉴의 링크가 함께 따라온다. */
export function trackerNavGroupsSignal(projectId: Signal<string>): Signal<readonly NavGroup[]> {
  return computed(() => trackerNavGroups(projectId()));
}
