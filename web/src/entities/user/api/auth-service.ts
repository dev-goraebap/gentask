import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS } from '@/shared/api';

@Injectable()
export class AuthService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly httpClient = inject(HttpClient);

  // --- 가입 --------------------------------------------------------------------------------------
  /** 가입을 시작한다. 계정은 아직 생기지 않고 그 주소로 코드가 간다. */
  async requestSignup(email: string, password: string): Promise<void> {
    await firstValueFrom(this.httpClient.post<void>(ENDPOINTS.signup, { email, password }));
  }

  /** 코드를 확인한다. 끝나면 곧바로 로그인 상태다. */
  async confirmSignup(email: string, code: string): Promise<void> {
    await firstValueFrom(this.httpClient.post<void>(ENDPOINTS.signupConfirm, { email, code }));
  }

  async resendSignupCode(email: string): Promise<void> {
    await firstValueFrom(this.httpClient.post<void>(ENDPOINTS.signupResend, { email }));
  }

  // --- 로그인 -------------------------------------------------------------------------------------
  async login(email: string, password: string): Promise<void> {
    await firstValueFrom(this.httpClient.post<void>(ENDPOINTS.login, { email, password }));
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.httpClient.post<void>(ENDPOINTS.logout, {}));
  }

  // --- 비밀번호 -----------------------------------------------------------------------------------
  /** 응답은 그 이메일의 등록 여부와 무관하게 같다. */
  async requestPasswordReset(email: string): Promise<void> {
    await firstValueFrom(this.httpClient.post<void>(ENDPOINTS.passwordReset, { email }));
  }

  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
    await firstValueFrom(
      this.httpClient.post<void>(ENDPOINTS.passwordResetConfirm, { email, code, newPassword }),
    );
  }

  async resendPasswordResetCode(email: string): Promise<void> {
    await firstValueFrom(this.httpClient.post<void>(ENDPOINTS.passwordResetResend, { email }));
  }

  /** 지금 쓰는 자리는 남고 다른 자리의 로그인은 끊긴다. */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await firstValueFrom(
      this.httpClient.put<void>(ENDPOINTS.password, { currentPassword, newPassword }),
    );
  }
}
