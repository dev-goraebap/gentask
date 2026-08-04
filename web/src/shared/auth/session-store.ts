import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { ApiError } from '@/shared/api';

import { SessionApi } from './session-api';
import type { CurrentSession } from './session';

/**
 * 현재 세션 상태 (AUTH-01·06).
 *
 * 세션 토큰은 `HttpOnly` 쿠키에 있어 자바스크립트가 볼 수 없다(결정-0014). 그래서 이 저장소가
 * 들고 있는 것은 토큰이 아니라 **서버에 물어본 결과**이며, 로그인 여부의 판정도 서버가 한다.
 * 클라이언트에 로그인 플래그를 따로 두면 서버가 세션을 끊은 뒤에도 화면만 로그인 상태로
 * 남는다.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly api = inject(SessionApi);
  private readonly 브라우저 = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly 현재 = signal<CurrentSession | null>(null);
  /** 서버에 한 번이라도 물어봤는가. "물어보니 없었다"와 "아직 안 물어봤다"는 다르다. */
  private 확인함 = false;

  readonly session = this.현재.asReadonly();
  readonly isAuthenticated = computed(() => this.현재() !== null);

  /**
   * 세션을 확인한다. 이미 확인했으면 다시 묻지 않는다.
   *
   * **서버에서는 항상 비로그인으로 답한다.** 공개 페이지는 프리렌더(빌드 시점)라 요청도
   * 쿠키도 없고, 인증 후 화면은 `RenderMode.Client`라 서버에서 돌지 않는다(웹.md §5).
   * 여기서 굳이 호출하면 빌드가 API 서버에 의존하게 된다.
   *
   * 401이 아닌 실패는 **삼키지 않고 던진다.** 서버가 죽은 것을 "로그아웃"으로 바꿔 버리면
   * 사용자는 멀쩡한 세션을 잃었다고 오해하고, 진짜 원인은 화면 어디에도 남지 않는다.
   */
  async ensureLoaded(): Promise<CurrentSession | null> {
    if (this.확인함 || !this.브라우저) {
      return this.현재();
    }

    try {
      this.현재.set(await this.api.currentSession());
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'unauthorized') {
        this.현재.set(null);
      } else {
        throw error;
      }
    }

    this.확인함 = true;
    return this.현재();
  }

  /** 로그인·가입 직후. 방금 세션이 생겼으므로 다시 물어보는 왕복을 아낀다. */
  async refresh(): Promise<CurrentSession | null> {
    this.확인함 = false;
    this.현재.set(null);
    return this.ensureLoaded();
  }

  /**
   * 로그아웃 (AUTH-01 — 해당 세션이 즉시 무효화된다).
   *
   * 서버 호출이 실패해도 로컬 상태는 비운다. 사용자가 "로그아웃"을 눌렀는데 화면이 로그인
   * 상태로 남는 것이 더 나쁘고, 서버 세션은 이미 끊겼는데 응답만 못 받은 경우도 있다.
   */
  async logout(): Promise<void> {
    try {
      await this.api.logout();
    } finally {
      this.현재.set(null);
      this.확인함 = true;
    }
  }

  /** 서버가 세션을 거부했을 때(만료·다른 기기에서 로그아웃) 로컬 상태를 맞춘다. */
  markExpired(): void {
    this.현재.set(null);
    this.확인함 = true;
  }
}
