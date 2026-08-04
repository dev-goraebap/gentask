import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_V1 } from '@/shared/api';

import type { CurrentSession, EmailVerification, IssuedSession, SignupResult } from './session';

/**
 * 인증 API 호출 (AUTH-01, 설계/서버.md §1.5·§1.6).
 *
 * **`transport`를 보내지 않는다.** 생략하면 서버 기본값이 쿠키 전달이고(`LoginRequest`),
 * 웹은 그 경로를 쓴다 — 토큰이 본문에 실리지 않아 XSS가 읽을 것이 없다(결정-0014).
 * 여기서 굳이 `"COOKIE"`를 명시하면 나중에 누군가 그 자리를 `"BEARER"`로 바꿔 보고
 * "동작하네"라고 결론 내릴 여지가 생긴다.
 *
 * 관측 가능한 상태를 갖지 않는다 — 그것은 {@link SessionStore}의 몫이다. 호출과 상태를
 * 한 클래스에 두면 테스트에서 호출만 가짜로 바꿀 수 없다.
 */
@Injectable({ providedIn: 'root' })
export class SessionApi {
  private readonly http = inject(HttpClient);

  /** 가입용 OTP 발급. 응답이 계정 존재 여부를 노출하지 않는다(요구사항 공통 규칙). */
  issueSignupVerification(email: string): Promise<EmailVerification> {
    return firstValueFrom(
      this.http.post<EmailVerification>(`${API_V1}/email-verifications`, { email }),
    );
  }

  /** 가입 완료 — OTP 통과와 계정 생성이 한 호출이다. 성공하면 세션 쿠키가 함께 내려온다. */
  signup(verificationId: string, code: string, password: string): Promise<SignupResult> {
    return firstValueFrom(
      this.http.post<SignupResult>(`${API_V1}/users`, { verificationId, code, password }),
    );
  }

  login(email: string, password: string): Promise<IssuedSession> {
    return firstValueFrom(this.http.post<IssuedSession>(`${API_V1}/sessions`, { email, password }));
  }

  currentSession(): Promise<CurrentSession> {
    return firstValueFrom(this.http.get<CurrentSession>(`${API_V1}/sessions/current`));
  }

  /** 로그아웃 — 세션은 서버에서 즉시 무효화되고 쿠키는 만료된 값으로 덮인다. */
  logout(): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_V1}/sessions/current`));
  }
}
