import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS } from '@/shared/api';

/**
 * 가입 · 로그인 · 로그아웃 (TK-005). 상태를 갖지 않습니다.
 *
 * 세션 토큰은 응답 본문이 아니라 HttpOnly 쿠키로 오가므로 여기서 다룰 값이 없습니다.
 * 로그인 · 가입 라우트와 셸 라우트의 providers 에 등록합니다.
 */
@Injectable()
export class AuthCommands {
  private readonly http = inject(HttpClient);

  async signup(email: string, password: string): Promise<void> {
    await firstValueFrom(this.http.post<void>(ENDPOINTS.signup, { email, password }));
  }

  async login(email: string, password: string): Promise<void> {
    await firstValueFrom(this.http.post<void>(ENDPOINTS.login, { email, password }));
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post<void>(ENDPOINTS.logout, {}));
  }
}
