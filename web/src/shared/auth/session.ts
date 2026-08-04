/**
 * 인증 계약의 클라이언트 측 타입 (설계/서버.md §1.5·§1.6).
 *
 * 서버의 응답 record와 1:1로 맞춘다. 서버가 계약을 바꾸면 여기가 함께 바뀌어야 하며,
 * 그 사실을 잊지 않도록 필드 이름을 서버와 똑같이 둔다 — 중간에서 이름을 바꾸면
 * 어긋난 순간을 알아채는 지점이 사라진다.
 */

/** `GET /api/v1/sessions/current`. */
export interface CurrentSession {
  readonly userId: string;
  readonly email: string;
  /** 아직 닉네임을 정하지 않은 계정이 있다 — 화면이 이메일로 대체한다. */
  readonly nickname: string | null;
  readonly expiresAt: string;
}

/**
 * `POST /api/v1/email-verifications`.
 *
 * `verificationId`는 **인증 자격이 아니다.** 이것으로 세션을 얻을 수 없고, 검증 호출에
 * 필요한 핸들일 뿐이다(설계/서버.md §1.6). 응답 형태는 계정 존재 여부와 무관하게 동일하다.
 */
export interface EmailVerification {
  readonly verificationId: string;
}

/** `POST /api/v1/sessions` — 쿠키 전달을 쓰므로 본문에 토큰이 실리지 않는다. */
export interface IssuedSession {
  readonly userId: string;
  readonly expiresAt: string;
}

/** `POST /api/v1/users`. */
export interface SignupResult {
  readonly userId: string;
  readonly email: string;
  readonly sessionExpiresAt: string;
}
