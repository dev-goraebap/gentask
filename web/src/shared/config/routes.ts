export const ROUTES = {
  home: () => '/',

  taskList: (view = 'all') => `/tasks/${view}`,

  tasks: () => '/tasks',

  account: () => '/account',

  login: () => '/login',
  signup: () => '/signup',

  admin: () => '/admin',
} as const;

export const TASK_PANEL = {
  param: 'task',
  open: (id: string) => ({ task: id }),
  close: () => ({ task: null }),
} as const;
