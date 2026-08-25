import { InjectionToken } from '@angular/core';
import { lucideCalendarRange, lucideHouse, lucideStar, lucideSun } from '@ng-icons/lucide';
import { TASK_VIEWS, type TaskView } from '@/entities/task';
import { ROUTES } from '@/shared/config';

export interface NavItem {
  readonly label: string;
  readonly icon: string;
  readonly link: string;
}

export const NAV_ICONS = { lucideCalendarRange, lucideHouse, lucideStar, lucideSun };

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
