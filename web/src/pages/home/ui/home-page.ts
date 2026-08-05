import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { type CurrentSession, SessionStore } from '@/shared/auth';
import { UiButton, UiCard } from '@/shared/ui';

/**
 * 로그인 후 첫 화면 (AUTH-01의 로그아웃).
 *
 * **이 화면의 목적은 스파인 증명이다** — 가입·로그인으로 만들어진 세션이 실제로 서버에서
 * 읽히고, 로그아웃으로 즉시 끊기는 것을 눈으로 확인하는 자리. 여기에 기능을 얹기 시작하면
 * 그 확인이 다른 것들에 가려진다.
 *
 * 세션은 라우트 리졸버가 이미 확보해 입력으로 들어온다 — **화면 안에 로딩 분기가 없다**
 * (설계/웹.md §6.1, 결정-0012).
 */
@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, UiButton, UiCard],
  host: { class: 'flex min-h-dvh items-center justify-center bg-background p-4' },
  template: `
    <ui-card class="w-full max-w-120">
      @if (session(); as user) {
        <header class="flex flex-col gap-1">
          <h1 class="t-headline-md">{{ user.nickname ?? user.email }}</h1>
          <p class="t-body-sm text-fg-muted">로그인되어 있습니다.</p>
        </header>

        <dl class="flex flex-col gap-3 border-t border-border pt-4">
          <div class="flex justify-between gap-4">
            <dt class="t-label-sm text-fg-muted">이메일</dt>
            <dd class="t-body-sm">{{ user.email }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="t-label-sm text-fg-muted">세션 만료</dt>
            <dd class="t-body-sm">{{ user.expiresAt | date: 'yyyy-MM-dd HH:mm' }}</dd>
          </div>
        </dl>
      }

      <div class="flex flex-wrap gap-2">
        <a ui-button routerLink="/app/devices">로그인된 기기</a>
        <button ui-button type="button" [loading]="signingOut()" (click)="signOut()">
          로그아웃
        </button>
      </div>
    </ui-card>
  `,
})
export class HomePage {
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);

  /** 리졸버가 넘긴 값 — `withComponentInputBinding()`이 이름으로 연결한다. */
  readonly session = input<CurrentSession | null>(null);

  protected readonly signingOut = signal(false);

  protected async signOut(): Promise<void> {
    this.signingOut.set(true);
    try {
      await this.store.logout();
      await this.router.navigateByUrl('/login');
    } finally {
      this.signingOut.set(false);
    }
  }
}
