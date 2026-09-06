export const ROUTES = {
  home: () => '/',

  /*
   * 투두 모드 라우터 경로 정의다.
   */
  todo: () => '/todo',
  taskList: (view = 'all') => `/todo/${view}`,

  account: () => '/me',

  /*
   * 펫 및 뽀모도로 등 모드 무관 전역 경로 정의다.
   */
  pets: () => '/pets',
  pomodoro: () => '/pomodoro',

  /*
   * 트래커 모드 라우터 경로 정의다.
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

  adminUsers: () => '/admin/users',
  adminNotifications: () => '/admin/notifications',
} as const;

export const TASK_PANEL = {
  param: 'task',
  open: (id: string) => ({ task: id }),
  close: () => ({ task: null }),
} as const;

/** 작업 항목 생성 다이얼로그 오버레이 경로다. */
export const ISSUE_CREATE_PANEL = {
  param: 'new',
  open: () => ({ new: 1 }),
  close: () => ({ new: null }),
} as const;

/** 프로젝트 생성 다이얼로그 오버레이 경로다. */
export const PROJECT_CREATE_PANEL = {
  param: 'new',
  open: () => ({ new: 1 }),
  close: () => ({ new: null }),
} as const;
