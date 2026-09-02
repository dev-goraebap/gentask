const TASKS = '/api/v1/tasks';
const ATTACHMENTS = '/api/v1/attachments';
const PUSH = '/api/v1/push';
const AUTH = '/api/v1/auth';
const ME = '/api/v1/me';
const ADMIN = '/api/v1/admin';
const PROJECTS = '/api/v1/projects';

export const ENDPOINTS = {
  // 올릴 자리 발급은 어디에 붙일지와 무관하므로 자리가 하나다. 붙이는 것은 도메인 경로가 받는다.
  attachmentPresign: `${ATTACHMENTS}/presign`,

  pushConfig: `${PUSH}/config`,
  pushSubscription: `${PUSH}/subscription`,

  tasks: TASKS,
  task: (taskId: string) => `${TASKS}/${taskId}`,
  taskCompletion: (taskId: string) => `${TASKS}/${taskId}/completion`,
  taskImportance: (taskId: string) => `${TASKS}/${taskId}/importance`,
  taskMyDay: (taskId: string) => `${TASKS}/${taskId}/my-day`,
  taskFiles: (taskId: string) => `${TASKS}/${taskId}/files`,
  taskFile: (taskId: string, fileId: string) => `${TASKS}/${taskId}/files/${fileId}`,

  signup: `${AUTH}/signup`,
  signupConfirm: `${AUTH}/signup/confirm`,
  signupResend: `${AUTH}/signup/resend`,
  login: `${AUTH}/login`,
  logout: `${AUTH}/logout`,
  passwordReset: `${AUTH}/password-reset`,
  passwordResetConfirm: `${AUTH}/password-reset/confirm`,
  passwordResetResend: `${AUTH}/password-reset/resend`,

  me: ME,
  password: `${ME}/password`,
  apiToken: `${ME}/api-token`,
  profileImage: `${ME}/profile-image`,

  // 주소가 UUID 가 아니라 접두어를 갖는다. 사람이 읽고 공유할 수 있어야 하기 때문이다.
  projects: PROJECTS,
  project: (projectKey: string) => `${PROJECTS}/${projectKey}`,
  issues: (projectKey: string) => `${PROJECTS}/${projectKey}/issues`,
  issue: (projectKey: string, number: number) => `${PROJECTS}/${projectKey}/issues/${number}`,
  issueState: (projectKey: string, number: number) => `${PROJECTS}/${projectKey}/issues/${number}/state`,

  // 문서는 번호를 매기지 않으므로 그 자리에 식별자가 그대로 온다.
  docs: (projectKey: string) => `${PROJECTS}/${projectKey}/documents`,
  doc: (projectKey: string, documentId: string) =>
    `${PROJECTS}/${projectKey}/documents/${documentId}`,

  adminUsers: `${ADMIN}/users`,
  adminPushFailures: `${ADMIN}/push/failures`,
  adminPushFailureResolve: (failureId: string) => `${ADMIN}/push/failures/${failureId}/resolve`,
  adminPushFailureRevoke: (failureId: string) => `${ADMIN}/push/failures/${failureId}/revoke`,
} as const;
