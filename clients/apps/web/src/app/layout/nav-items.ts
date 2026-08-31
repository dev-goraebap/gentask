import { InjectionToken } from '@angular/core';
import { TASK_VIEWS } from '@/entities/task';
import { MORE_NAV_ITEMS, type NavItem, ROUTES } from '@/shared/config';

export type { NavItem };

/**
 * 메뉴의 묶음.
 *
 * <p>항목이 늘면서 무엇이 무엇과 한 갈래인지가 목록만으로는 드러나지 않는다. 라벨을 얹어 갈래를
 * 보이게 하고, 라벨이 없는 묶음은 이름 없이 항목만 그린다.
 */
export interface NavGroup {
  readonly label?: string;
  readonly items: readonly NavItem[];
}

export const NAV_GROUPS = new InjectionToken<readonly NavGroup[]>('NAV_GROUPS', {
  factory: () => [
    {
      label: '작업',
      items: TASK_VIEWS.map((view) => ({
        label: view.label,
        icon: view.icon,
        link: ROUTES.taskList(view.value),
      })),
    },
    {
      label: '더보기',
      items: MORE_NAV_ITEMS,
    },
  ],
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

/** 관리 자리의 메뉴. 사용자 자리의 것과 겹치지 않아 갈래가 하나뿐이며 라벨을 두지 않는다. */
export const ADMIN_NAV_GROUPS: readonly NavGroup[] = [
  {
    items: [
      { label: '사용자 관리', icon: 'hgiUsers', link: ROUTES.adminUsers() },
      { label: '알림 문제', icon: 'hgiNotificationOff', link: ROUTES.adminNotifications() },
    ],
  },
];
