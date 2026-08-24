/** 경로가 바뀌어도 컴파일이 잡지 못합니다. 14-api-contract.md 3절. */
const TASKS = '/api/v1/tasks';

export const ENDPOINTS = {
  tasks: TASKS,
  task: (taskId: string) => `${TASKS}/${taskId}`,
  taskCompletion: (taskId: string) => `${TASKS}/${taskId}/completion`,
  taskImportance: (taskId: string) => `${TASKS}/${taskId}/importance`,
  taskMyDay: (taskId: string) => `${TASKS}/${taskId}/my-day`,
} as const;
