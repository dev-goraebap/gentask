/**
 * 서버 경로를 한자리에 모읍니다.
 *
 * 경로는 문자열이라 바뀌어도 컴파일이 잡지 못합니다. 계약 변경 중 유일하게 타입으로
 * 검출되지 않는 것이므로 흩어 두면 버전이 올라갈 때 검색으로 찾아야 합니다.
 * 14-api-contract.md 3절.
 */
const TASKS = '/api/v1/tasks';

export const ENDPOINTS = {
  tasks: TASKS,
  task: (taskId: string) => `${TASKS}/${taskId}`,
  taskCompletion: (taskId: string) => `${TASKS}/${taskId}/completion`,
  taskImportance: (taskId: string) => `${TASKS}/${taskId}/importance`,
  taskMyDay: (taskId: string) => `${TASKS}/${taskId}/my-day`,
} as const;
