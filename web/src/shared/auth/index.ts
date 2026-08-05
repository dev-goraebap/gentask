/**
 * shared/auth 공개 API.
 *
 * 바깥에서는 이 파일을 통해서만 가져온다(`@/shared/auth`) — 웹.md §1의 세그먼트 공개 API 규칙.
 * 토큰·로그인 DTO는 인증 문맥 전용이라 `entities/user`로 만들지 않는다(웹.md §3).
 */
export { SessionApi } from './session-api';
export { SessionStore } from './session-store';
export {
  REASON_PARAM,
  REASON_UNAVAILABLE,
  RETURN_URL_PARAM,
  requireGuest,
  requireSession,
  resolveActiveSessions,
  resolveCurrentSession,
} from './session-guard';
export type {
  CurrentSession,
  EmailVerification,
  IssuedSession,
  RecoveryLogin,
  SignupResult,
  UserSession,
} from './session';
export { SOCIAL_PROVIDERS, socialLoginStartUrl, type SocialProvider } from './social-provider';
