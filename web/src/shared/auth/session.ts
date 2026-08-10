/**
 * 인증 계약의 클라이언트 측 타입 (server/docs/references/API-설계.md §5·§6).
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
 * 필요한 핸들일 뿐이다(server/docs/references/API-설계.md §6). 응답 형태는 계정 존재 여부와 무관하게 동일하다.
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

/**
 * `GET /api/v1/sessions`의 한 줄 — 로그인된 기기 하나 (AUTH-06).
 *
 * **`ipAddress`·`userAgent`는 공격자 통제 값이다**(server/docs/references/API-설계.md §6.1). 자기 로그인 요청에
 * 임의의 User-Agent를 넣을 수 있고 서버는 그것을 원문 그대로 내려준다. 서버는 이 값을 인증
 * 판단에 쓰지 않으므로 서버 결함이 아니며, **이스케이프는 화면의 책임**이다.
 * Angular의 보간과 속성 바인딩은 기본으로 안전하다 — 이 값에 `innerHTML`·
 * `bypassSecurityTrustHtml`을 쓰지 않는다.
 */
export interface UserSession {
  readonly id: string;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly lastUsedAt: string;
  readonly createdAt: string;

  /** 지금 이 요청을 보낸 세션인가. 실수로 자기 기기를 끊지 않도록 화면이 구분해 보여준다. */
  readonly current: boolean;
}

/** `POST /api/v1/account-recoveries/confirm` (AUTH-08). */
export interface RecoveryLogin {
  readonly userId: string;
  readonly sessionExpiresAt: string;

  /**
   * 비밀번호가 없는 계정이라는 뜻.
   *
   * 인증 수단을 잃어 들어온 사용자가 그대로 나가면 다음에 또 복구를 해야 하므로, 화면이
   * 비밀번호 설정을 권한다. **다만 설정 기능(PROF-03)은 아직 없다** — 안내는 하되 없는 경로를
   * 약속하지 않는다.
   */
  readonly shouldSetPassword: boolean;
}
