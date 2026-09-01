export const ROUTES = {
  home: () => '/',

  /*
   * 투두 모드의 자리는 전부 `/todo` 아래에 있다. 그릇에 제 이름이 있어야 그 아래 목록들과 층이
   * 갈린다 — 그릇 이름과 그 안의 항목 이름이 같으면 `할 일` 처럼 한 말이 두 층을 가리킨다.
   */
  todo: () => '/todo',
  taskList: (view = 'all') => `/todo/${view}`,

  /*
   * 메모와 팻과 뽀모도로는 모드에 매이지 않는다. 다른 모드의 메뉴에서도 더보기로 서야 하므로
   * 어느 그릇 안에도 넣지 않는다.
   */
  memos: () => '/memos',

  account: () => '/me',

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

/** 세우는 중인 프로젝트. 덮개가 열려 있는가를 주소가 갖는다. */
export const PROJECT_CREATE_PANEL = {
  param: 'new',
  open: () => ({ new: 1 }),
  close: () => ({ new: null }),
} as const;
