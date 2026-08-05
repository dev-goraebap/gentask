import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { toApiError } from '@/shared/api';
import { SessionApi, SessionStore, type UserSession } from '@/shared/auth';
import { UiAlert, UiButton, UiCard, UiLink } from '@/shared/ui';

/**
 * 기기 관리 (AUTH-06) — 로그인된 세션 목록과 개별 로그아웃.
 *
 * **여기 보이는 `userAgent`·`ipAddress`는 공격자가 통제하는 값이다**(설계/서버.md §1.6.1).
 * 자기 로그인 요청에 임의의 User-Agent를 넣을 수 있고 서버는 그것을 원문 그대로 내려준다.
 * Angular의 보간은 기본으로 이스케이프하므로 **그대로 쓰면 안전하고**, 이 값에
 * `innerHTML`·`bypassSecurityTrustHtml`을 쓰는 순간 자기 화면 한정 XSS가 된다.
 * User-Agent를 파싱해 기기 아이콘을 붙이고 싶어지는 화면이라 특히 조심한다.
 *
 * 목록은 라우트 리졸버가 확보해 입력으로 들어온다 — **화면 안에 로딩 분기가 없다**
 * (웹.md §6.1). 로그아웃 이후의 갱신만 화면이 스스로 하며 그때는 지역 로딩 표시를 쓴다(§6.3).
 */
@Component({
  selector: 'app-devices-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, UiAlert, UiButton, UiCard, UiLink],
  host: { class: 'flex min-h-dvh justify-center bg-background p-4' },
  template: `
    <div class="flex w-full max-w-160 flex-col gap-4 py-8">
      <header class="flex flex-col gap-1">
        <h1 class="t-headline-md">로그인된 기기</h1>
        <p class="t-body-sm text-fg-muted">
          내 계정에 로그인되어 있는 기기 목록입니다. 낯선 기기가 있으면 로그아웃해 주세요.
        </p>
      </header>

      @if (error(); as message) {
        <ui-alert intent="danger">{{ message }}</ui-alert>
      }

      @for (session of rows(); track session.id) {
        <ui-card>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex min-w-0 flex-col gap-1">
              <div class="flex items-center gap-2">
                <!-- 보간이 이스케이프한다. 이 값에 innerHTML을 쓰지 않는다. -->
                <p class="t-body-md break-all">{{ session.userAgent ?? '알 수 없는 기기' }}</p>
                @if (session.current) {
                  <span
                    class="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[0.75rem] text-primary"
                  >
                    현재 기기
                  </span>
                }
              </div>
              <p class="t-body-sm text-fg-faint">
                {{ session.ipAddress ?? 'IP 없음' }} · 마지막 사용
                {{ session.lastUsedAt | date: 'yyyy-MM-dd HH:mm' }} · 로그인
                {{ session.createdAt | date: 'yyyy-MM-dd' }}
              </p>
            </div>

            <button
              ui-button
              type="button"
              size="sm"
              [variant]="session.current ? 'secondary' : 'danger'"
              [loading]="revoking() === session.id"
              (click)="revoke(session)"
            >
              {{ session.current ? '이 기기 로그아웃' : '로그아웃' }}
            </button>
          </div>
        </ui-card>
      } @empty {
        <ui-card>
          <p class="t-body-sm text-fg-muted">표시할 기기가 없습니다.</p>
        </ui-card>
      }

      <p class="t-body-sm text-fg-muted"><a ui-link routerLink="/app">돌아가기</a></p>
    </div>
  `,
})
export class DevicesPage {
  private readonly api = inject(SessionApi);
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);

  /** 리졸버가 넘긴 값 — `withComponentInputBinding()`이 이름으로 연결한다. */
  readonly sessions = input<UserSession[]>([]);

  /** 로그아웃 이후의 목록. 리졸버 결과를 덮어쓰지 않고 옆에 둔다. */
  private readonly 갱신됨 = signal<UserSession[] | null>(null);

  protected readonly rows = computed(() => this.갱신됨() ?? this.sessions());
  protected readonly revoking = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected async revoke(session: UserSession): Promise<void> {
    this.revoking.set(session.id);
    this.error.set(null);

    try {
      await this.api.revokeSession(session.id);

      // 자기 세션을 끊었으면 서버가 쿠키까지 지웠다 — 목록을 다시 불러 봐야 401이다.
      // 로컬 상태를 맞추고 로그인으로 보내는 것이 이 경우의 유일한 올바른 다음 화면이다.
      if (session.current) {
        this.store.markExpired();
        await this.router.navigateByUrl('/login');
        return;
      }

      this.갱신됨.set(await this.api.activeSessions());
    } catch (error) {
      this.error.set(toApiError(error).message);
    } finally {
      this.revoking.set(null);
    }
  }
}
