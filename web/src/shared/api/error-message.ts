import type { ApiErrorKind } from './api-error';

/**
 * 서버 에러 코드 → 사용자 문구 (설계/웹.md §3, 서버.md §1.4의 클라이언트 대응물).
 *
 * **서버의 `title`·`detail`을 그대로 쓰지 않는 이유**는 그것이 계약이 아니기 때문이다.
 * 서버는 문구가 바뀔 수 있다고 명시했고 계약인 것은 `code`뿐이다. 문구를 여기 두면
 * 화면 사정(다음에 무엇을 하라는 안내)을 덧붙일 수 있다는 이득도 함께 얻는다.
 *
 * 매핑에 없는 코드는 서버 문구로 되돌아간다 — 새 코드가 생겨도 화면이 침묵하지 않는다.
 */
const 코드별문구: Readonly<Record<string, string>> = {
  AUTH_UNAUTHENTICATED: '로그인이 필요합니다.',
  AUTH_INVALID_CREDENTIALS: '이메일 또는 비밀번호를 확인해 주세요.',
  // 대개 오래 열어 둔 탭에서 발생한다 — 새로고침이 실제 처방이다
  AUTH_FORBIDDEN_ORIGIN: '요청을 확인할 수 없습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
  AUTH_OTP_INVALID: '확인 코드가 올바르지 않습니다.',
  AUTH_OTP_EXPIRED: '확인 코드가 만료되었습니다. 코드를 다시 받아 주세요.',
  AUTH_OTP_ATTEMPTS_EXCEEDED: '확인 코드를 너무 여러 번 틀렸습니다. 코드를 다시 받아 주세요.',
  AUTH_OTP_RATE_LIMITED: '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.',
  AUTH_TOO_MANY_ATTEMPTS: '시도가 너무 잦습니다. 잠시 후 다시 시도해 주세요.',
  AUTH_EMAIL_ALREADY_USED: '이미 가입된 이메일입니다.',
  AUTH_SESSION_NOT_FOUND: '세션을 찾을 수 없습니다.',
  AUTH_SOCIAL_TICKET_INVALID: '소셜 로그인을 처음부터 다시 시작해 주세요.',
};

/**
 * 코드도 서버 문구도 없을 때의 최후 문구.
 *
 * 유형별로 다르게 두는 이유: "알 수 없는 오류"만 남으면 사용자가 **무엇을 해야 하는지**
 * 알 수 없다. 네트워크가 끊긴 것과 서버가 죽은 것은 사용자가 취할 행동이 다르다.
 */
const 유형별문구: Readonly<Record<ApiErrorKind, string>> = {
  offline: '네트워크에 연결할 수 없습니다. 연결을 확인한 뒤 다시 시도해 주세요.',
  validation: '입력한 내용을 다시 확인해 주세요.',
  unauthorized: '로그인이 필요합니다.',
  forbidden: '접근 권한이 없습니다.',
  notFound: '요청한 정보를 찾을 수 없습니다.',
  conflict: '이미 처리된 요청입니다.',
  rateLimited: '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.',
  server: '서버에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.',
  unknown: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
};

export function resolveErrorMessage(kind: ApiErrorKind, code?: string, 서버문구?: string): string {
  if (code && code in 코드별문구) {
    return 코드별문구[code];
  }
  return 서버문구?.trim() || 유형별문구[kind];
}
