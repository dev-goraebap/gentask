import { Routes } from '@angular/router';
import { TaskCommands, TaskList } from '@/entities/task/providers';
import { authGuard } from '@/entities/user/guard';
import { AuthCommands, CurrentUser, MeCommands } from '@/entities/user/providers';
import { provideTaskListDatePicker } from '@/pages/task-list/providers';
import { AppShell } from './layout/app-shell';

export const routes: Routes = [
  {
    path: 'login',
    providers: [AuthCommands],
    loadComponent: () => import('@/pages/login').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    providers: [AuthCommands],
    loadComponent: () => import('@/pages/signup').then((m) => m.SignupPage),
  },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    providers: [CurrentUser, MeCommands, AuthCommands],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tasks' },
      {
        path: 'account',
        loadComponent: () => import('@/pages/account').then((m) => m.AccountPage),
      },
      {
        path: 'tasks',
        providers: [TaskList, TaskCommands, ...provideTaskListDatePicker()],
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
