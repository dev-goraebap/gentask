import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS } from '@/shared/api';

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
