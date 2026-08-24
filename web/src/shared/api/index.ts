import type { components } from './generated/schema';

export { ENDPOINTS } from './endpoints';
export { problemDetail } from './problem';

/** 필드 대응만 하는 변환 계층을 두지 않습니다. 14-api-contract.md 2절. */
export type TaskView = components['schemas']['TaskView'];
export type CreateTask = components['schemas']['CreateTask'];
export type EditTask = components['schemas']['EditTask'];
export type ChangeCompletion = components['schemas']['ChangeCompletion'];
export type ChangeImportance = components['schemas']['ChangeImportance'];
export type ChangeMyDay = components['schemas']['ChangeMyDay'];
export type TaskFileView = components['schemas']['TaskFileView'];
export type PresignedUpload = components['schemas']['PresignedUpload'];
export type MeView = components['schemas']['MeView'];
export type IssuedApiToken = components['schemas']['IssuedApiToken'];
export type Signup = components['schemas']['Signup'];
export type Login = components['schemas']['Login'];
