export const ROUTES = {
  home: () => '/',

  taskList: (view = 'all') => `/tasks/${view}`,

  tasks: () => '/tasks',

  account: () => '/account',

  pets: () => '/pets',
  pomodoro: () => '/pomodoro',

  login: () => '/login',
  signup: () => '/signup',
  passwordReset: () => '/password-reset',

  admin: () => '/admin',
  adminUsers: () => '/admin/users',
  adminNotifications: () => '/admin/notifications',
} as const;

export const TASK_PANEL = {
  param: 'task',
  open: (id: string) => ({ task: id }),
  close: () => ({ task: null }),
} as const;
