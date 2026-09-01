export const ROUTES = {
  home: () => '/',

  taskList: (view = 'all') => `/tasks/${view}`,

  tasks: () => '/tasks',

  memos: () => '/memos',

  account: () => '/account',

  pets: () => '/pets',
  pomodoro: () => '/pomodoro',

  tracker: () => '/tracker',
  issues: () => '/tracker/issues',
  issue: (id: string) => `/tracker/issues/${id}`,
  docs: () => '/tracker/docs',
  doc: (id: string) => `/tracker/docs/${id}`,
  projectSettings: () => '/tracker/settings',

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

/** 세우는 중인 작업 아이템. 덮개가 열려 있는가를 주소가 갖는다. */
export const ISSUE_CREATE_PANEL = {
  param: 'new',
  open: () => ({ new: 1 }),
  close: () => ({ new: null }),
} as const;

/** 고른 메모. 곁자리의 목록에서 무엇을 펼쳐 두었는가를 주소가 갖는다. */
export const MEMO_PANEL = {
  param: 'memo',
  open: (id: string) => ({ memo: id }),
} as const;
