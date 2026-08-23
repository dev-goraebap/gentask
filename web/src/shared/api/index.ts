import type { components } from './generated/schema';

export { ENDPOINTS } from './endpoints';

/**
 * 서버 계약의 타입입니다. 이름을 붙여 내보낼 뿐 모양을 바꾸지 않습니다.
 *
 * 필드 대응만 하는 변환 계층을 두지 않습니다. 서버 어휘가 화면 코드에 드러나는 것이
 * 그 대가이며, 대신 필드가 늘 때마다 고칠 매핑이 없습니다. 14-api-contract.md 2절.
 */
export type TaskView = components['schemas']['TaskView'];
export type CreateTask = components['schemas']['CreateTask'];
export type EditTask = components['schemas']['EditTask'];
export type ChangeCompletion = components['schemas']['ChangeCompletion'];
export type ChangeImportance = components['schemas']['ChangeImportance'];
export type ChangeMyDay = components['schemas']['ChangeMyDay'];
