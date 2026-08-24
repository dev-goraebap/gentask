const TASKS = '/api/v1/tasks';
const AUTH = '/api/v1/auth';
const ME = '/api/v1/me';

export const ENDPOINTS = {
  tasks: TASKS,
  task: (taskId: string) => `${TASKS}/${taskId}`,
  taskCompletion: (taskId: string) => `${TASKS}/${taskId}/completion`,
  taskImportance: (taskId: string) => `${TASKS}/${taskId}/importance`,
  taskMyDay: (taskId: string) => `${TASKS}/${taskId}/my-day`,
  taskFiles: (taskId: string) => `${TASKS}/${taskId}/files`,
  taskFilePresign: (taskId: string) => `${TASKS}/${taskId}/files/presign`,
  taskFile: (taskId: string, fileId: string) => `${TASKS}/${taskId}/files/${fileId}`,

  signup: `${AUTH}/signup`,
  login: `${AUTH}/login`,
  logout: `${AUTH}/logout`,

  me: ME,
  apiToken: `${ME}/api-token`,
  profileImage: `${ME}/profile-image`,
  profileImagePresign: `${ME}/profile-image/presign`,
} as const;
