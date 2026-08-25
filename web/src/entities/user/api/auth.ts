import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS } from '@/shared/api';

@Injectable()
export class AuthService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly httpClient = inject(HttpClient);

  // --- 동작 --------------------------------------------------------------------------------------
  async signup(email: string, password: string): Promise<void> {
    await firstValueFrom(this.httpClient.post<void>(ENDPOINTS.signup, { email, password }));
  }

  async login(email: string, password: string): Promise<void> {
    await firstValueFrom(this.httpClient.post<void>(ENDPOINTS.login, { email, password }));
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.httpClient.post<void>(ENDPOINTS.logout, {}));
  }
}
