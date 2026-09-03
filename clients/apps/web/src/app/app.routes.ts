import { computed, inject, signal } from '@angular/core';
import { Routes } from '@angular/router';
import { DocService } from '@/entities/doc/providers';
import { IssueService } from '@/entities/issue/providers';
import { ProjectPicker, projectScopeGuard, ProjectService } from '@/entities/project/providers';
import { adminGuard, authGuard } from '@/entities/user/guard';
import { AuthService, UserService } from '@/entities/user/providers';
import { CURRENT_PROJECT_ID, trackerBottomNav } from '@/shared/config';
import { TaskService } from '@/entities/task';
import { AppShell } from './layout/app-shell';
import {
  ADMIN_NAV_GROUPS,
  BOTTOM_NAV,
  NAV_GROUPS,
  SHELL_AREA,
  SIDEBAR_LEAD,
  trackerNavGroupsSignal,
} from './layout/nav-items';

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
      { provide: NAV_GROUPS, useValue: ADMIN_NAV_GROUPS },
      // 좁은 화면을 아직 다루지 않는다. 띠를 세우지 않으면 그 자리는 넓은 화면 전용이 된다.
      { provide: BOTTOM_NAV, useValue: signal(null) },
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
    /*
     * 트래커 자리. 관리 자리와 같은 껍데기에 메뉴와 머리에 서는 것만 갈아 끼운다.
     *
     * `projects` 보다 **먼저** 서야 한다. 둘은 서로 다른 껍데기를 쓰는데(앞은 트래커 메뉴, 뒤는
     * 계정 메뉴), `projects` 가 먼저 서면 `/projects/<id>` 를 그것이 먼저 잡고 자식에서 실패해
     * 라우터의 되짚기에 기대게 된다. 세그먼트 수가 많은 쪽을 먼저 두면 그런 의존이 없다.
     */
    path: 'projects/:projectId',
    component: AppShell,
    canActivate: [authGuard, projectScopeGuard],
    providers: [
      UserService,
      AuthService,
      {
        provide: CURRENT_PROJECT_ID,
        useFactory: () => {
          const projectService = inject(ProjectService);
          return computed(() => projectService.current()?.id);
        },
      },
      IssueService,
      DocService,
      {
        provide: NAV_GROUPS,
        useFactory: () => {
          const projectService = inject(ProjectService);
          return trackerNavGroupsSignal(computed(() => projectService.current()?.id ?? ''));
        },
      },
      {
        provide: BOTTOM_NAV,
        useFactory: () => {
          const projectService = inject(ProjectService);
          return computed(() => trackerBottomNav(projectService.current()?.id ?? ''));
        },
      },
      { provide: SHELL_AREA, useValue: 'tracker' },
      { provide: SIDEBAR_LEAD, useValue: ProjectPicker },
    ],
    children: [
      // 좁은 화면의 메뉴는 아래에 깔린 띠가 갖는다. 그 자리를 화면으로 한 번 더 두지 않는다.
      { path: '', pathMatch: 'full', redirectTo: 'issues' },
      {
        path: 'issues',
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () => import('@/pages/tracker/issue-list').then((m) => m.IssueListPage),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('@/pages/tracker/issue-detail').then((m) => m.IssueDetailPage),
          },
        ],
      },
      {
        path: 'docs',
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () => import('@/pages/tracker/doc-list').then((m) => m.DocListPage),
          },
          {
            path: ':id',
            loadComponent: () => import('@/pages/tracker/doc-detail').then((m) => m.DocDetailPage),
          },
        ],
      },
      {
        path: 'settings',
        loadComponent: () => import('@/pages/tracker/settings').then((m) => m.ProjectSettingsPage),
      },
    ],
  },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    providers: [UserService, AuthService, TaskService],
    children: [
      // 첫 자리는 나의 하루다. 처음 여는 사람이 오늘 할 것부터 보는 것이 이 제품의 시작이다.
      { path: '', pathMatch: 'full', redirectTo: 'todo/my-day' },
      {
        // 프로젝트는 모드가 아니라 계정에 매인다. 어느 프로젝트에도 들어가지 않고 닿을 수 있어야 한다.
        path: 'projects',
        loadComponent: () => import('@/pages/project-list').then((m) => m.ProjectListPage),
      },
      {
        path: 'me',
        loadComponent: () => import('@/pages/account').then((m) => m.AccountPage),
      },
      // 아직 자리만 잡아 둔 시안이다. 규격이 서면 서술서와 인수 조건이 먼저 생긴다.
      {
        path: 'pets',
        loadComponent: () => import('@/pages/pet').then((m) => m.PetPage),
      },
      {
        path: 'pomodoro',
        loadComponent: () => import('@/pages/pomodoro').then((m) => m.PomodoroPage),
      },
      {
        /*
         * 투두 모드. 그릇이 제 이름을 가지므로 메뉴 화면이 목록을 겸하지 않는다.
         *
         * 그 아래의 라우트는 이 파일이 갖지 않는다. 날짜 고르개의 설정을 여기서 들여오면 고르개와
         * 달력 묶음이 첫 묶음에 실리기 때문이며, 근거는 `pages/task-list/routes.ts` 가 갖는다.
         */
        path: 'todo',
        loadChildren: () => import('@/pages/task-list').then((m) => m.taskListRoutes),
      },
    ],
  },
  { path: '**', redirectTo: '404' },
];
