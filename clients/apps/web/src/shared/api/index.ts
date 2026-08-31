import type { components } from 'api-types';

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
export type PushSubscriptionStateView = components['schemas']['PushSubscriptionStateView'];
export type AdminUserView = components['schemas']['AdminUserView'];
export type AdminUserPageView = components['schemas']['AdminUserPageView'];
export type PushFailureView = components['schemas']['PushFailureView'];
export type PushFailurePageView = components['schemas']['PushFailurePageView'];

