import type { components } from './generated/schema';

export { ENDPOINTS } from './endpoints';
export { injectAttachmentPresign, type AttachmentSlot } from './attachments';
export { problemDetail } from './problem';

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
export type PushConfigView = components['schemas']['PushConfigView'];
export type AdminUserView = components['schemas']['AdminUserView'];
export type AdminUserPageView = components['schemas']['AdminUserPageView'];
export type PushFailureView = components['schemas']['PushFailureView'];
export type PushFailurePageView = components['schemas']['PushFailurePageView'];

/**
 * 사용자가 가질 수 있는 역할.
 *
 * <p>생성된 스키마에서 끌어오지 않고 여기 적는다. 서버가 문자열로 내려 주므로 생성 결과가 넓은
 * `string` 이 되며, 화면이 두 값 중 하나임을 알아야 분기를 기계가 검사한다.
 */
export type UserRole = 'USER' | 'ADMIN';
