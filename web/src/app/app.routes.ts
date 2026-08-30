import { Routes } from '@angular/router';
import { adminGuard, authGuard } from '@/entities/user/guard';
import { AuthService, UserService } from '@/entities/user/providers';
import { provideTaskListDatePicker, TaskService } from '@/pages/task-list/providers';
import { AppShell } from './layout/app-shell';
import { ADMIN_NAV_ITEMS, NAV_ITEMS, SHELL_AREA } from './layout/nav-items';

export const routes: Routes = [
  {
    path: 'login',
    providers: [AuthService],
    loadComponent: () => import('@/pages/login').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    providers: [AuthService],
    loadComponent: () => import('@/pages/signup').then((m) => m.SignupPage),
  },
  {
    // 관리 자리는 껍데기를 따로 세운다. 메뉴 구성만 다르고 나머지는 같으므로 껍데기를 복제하지 않고
    // 자리와 메뉴를 주입으로 가른다.
    path: 'admin',
    component: AppShell,
    canActivate: [adminGuard],
    providers: [
      UserService,
      AuthService,
      { provide: NAV_ITEMS, useValue: ADMIN_NAV_ITEMS },
      { provide: SHELL_AREA, useValue: 'admin' },
    ],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'users' },
      {
        path: 'users',
        loadComponent: () => import('@/pages/admin/user').then((m) => m.AdminUserPage),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('@/pages/admin/notification').then((m) => m.AdminNotificationPage),
      },
    ],
  },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    providers: [UserService, AuthService],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tasks' },
      {
        path: 'account',
        loadComponent: () => import('@/pages/account').then((m) => m.AccountPage),
      },
      {
        path: 'tasks',
        providers: [TaskService, ...provideTaskListDatePicker()],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'all' },
          {
            path: ':view',
            loadComponent: () => import('@/pages/task-list').then((m) => m.TaskListPage),
          },
        ],
      },
    ],
  },
];
