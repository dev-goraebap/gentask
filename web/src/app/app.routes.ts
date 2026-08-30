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
    // 실패한 자리는 로그인하지 않아도 보여야 하므로 껍데기 밖에 둔다.
    path: '404',
    data: { kind: '404' },
    loadComponent: () => import('@/pages/error').then((m) => m.ErrorPage),
  },
  {
    path: '500',
    data: { kind: '500' },
    loadComponent: () => import('@/pages/error').then((m) => m.ErrorPage),
  },
  {
    // 비밀번호를 모르는 채 지나는 자리라 가드를 두지 않는다. 신원은 일회용 코드가 판정한다.
    path: 'password-reset',
    providers: [AuthService],
    loadComponent: () => import('@/pages/password-reset').then((m) => m.PasswordResetPage),
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
          // 좁은 화면의 첫 자리는 목록들이다. 넓은 화면에서는 사이드바가 그것을 이미 보여 주므로
          // 그 화면이 스스로 기본 목록으로 옮긴다. 옮기는 판정에 화면 폭이 필요해 리다이렉트로
          // 두지 않는다 — 서버는 폭을 모른다.
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () => import('@/pages/task-lists').then((m) => m.TaskListsPage),
          },
          {
            path: ':view',
            loadComponent: () => import('@/pages/task-list').then((m) => m.TaskListPage),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '404' },
];
