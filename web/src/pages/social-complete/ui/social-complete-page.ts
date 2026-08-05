import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SessionStore } from '@/shared/auth';
import { UiAlert, UiButton, UiCard, UiSpinner } from '@/shared/ui';

/**
 * 소셜 로그인 완료 랜딩 (AUTH-02·03).
 *
 * 서버가 세션 쿠키를 심고 이 주소로 리다이렉트한다 — **화면이 할 일은 그 세션을 확인하고
 * 앱으로 넘기는 것뿐이다.** 여기서 다시 로그인 API를 부르지 않는다.
 *
 * 이 화면이 따로 있는 이유는 서버가 리다이렉트할 목적지가 필요하기 때문이다. `/app`으로 곧장
 * 보내면 세션 쿠키를 아직 읽지 않은 상태에서 가드가 돌아 로그인으로 튕길 수 있다 —
 * **여기서 한 번 확인하고 넘기는 것이 그 경합을 없앤다.**
 *
 * 프리렌더된 정적 페이지라 잠깐 보였다 사라진다. 그 짧은 순간에도 무슨 일이 일어나는지
 * 보이도록 스피너와 문구를 둔다.
 */
@Component({
  selector: 'app-social-complete-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiAlert, UiButton, UiCard, UiSpinner],
  host: { class: 'flex min-h-dvh items-center justify-center bg-background p-4' },
  template: `
    <ui-card class="w-full max-w-100">
      @if (failed()) {
        <ui-alert intent="danger" title="로그인을 마치지 못했습니다">
          세션을 확인할 수 없습니다. 다시 로그인해 주세요.
        </ui-alert>
        <a ui-button variant="primary" size="lg" routerLink="/login">로그인 화면으로</a>
      } @else {
        <div class="flex items-center gap-3">
          <ui-spinner label="로그인 마무리 중" />
          <p class="t-body-md">로그인을 마무리하는 중입니다…</p>
        </div>
      }
    </ui-card>
  `,
})
export class SocialCompletePage {
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly failed = signal(false);

  constructor() {
    // 브라우저에서만 돈다. 프리렌더 중에 실행하면 세션이 있을 리 없어(요청도 쿠키도 없다)
    // **실패 화면이 그대로 구워진다** — 빌드 산출물이 "로그인 실패"를 담게 된다.
    afterNextRender(() => void this.finish());
  }

  private async finish(): Promise<void> {
    try {
      const session = await this.store.refresh();
      if (!session) {
        this.failed.set(true);
        return;
      }
      await this.router.navigateByUrl('/app');
    } catch {
      // 세션 확인 자체가 실패한 것(서버 장애·네트워크)도 여기서는 같은 처방이다 —
      // 사용자가 할 수 있는 일은 다시 시도뿐이고, 사유를 캐물어도 바뀌는 것이 없다
      this.failed.set(true);
    }
  }
}
