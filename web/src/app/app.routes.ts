import { Routes } from '@angular/router';
import { authGuard } from '@/entities/user/guard';
import { AuthService, UserService } from '@/entities/user/providers';
import { provideTaskListDatePicker, TaskService } from '@/pages/task-list/providers';
import { AppShell } from './layout/app-shell';

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
