export const ROUTES = {
  home: () => '/',

  taskList: (view = 'all') => `/tasks/${view}`,

  tasks: () => '/tasks',

  memos: () => '/memos',

  account: () => '/account',

  pets: () => '/pets',
  pomodoro: () => '/pomodoro',

  /*
   * 트래커의 자리는 전부 프로젝트 아래에 있다. 프로젝트를 기본으로 하나 주므로 그 하나만 쓰는
   * 사람에게도 주소에 프로젝트가 드러나고, 둘째가 생겨도 주소의 모양이 바뀌지 않는다.
   */
  projects: () => '/projects',
  project: (projectId: string) => `/projects/${projectId}`,
  issues: (projectId: string) => `/projects/${projectId}/issues`,
  issue: (projectId: string, id: string) => `/projects/${projectId}/issues/${id}`,
  docs: (projectId: string) => `/projects/${projectId}/docs`,
  doc: (projectId: string, id: string) => `/projects/${projectId}/docs/${id}`,
  projectSettings: (projectId: string) => `/projects/${projectId}/settings`,

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
