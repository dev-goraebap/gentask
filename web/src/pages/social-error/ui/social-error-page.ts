import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SOCIAL_PROVIDERS, type SocialProvider, socialLoginStartUrl } from '@/shared/auth';
import { UiAlert, UiButton, UiCard } from '@/shared/ui';

/**
 * 서버가 리다이렉트에 실어 보내는 사유 (`SocialLoginSuccessHandler`·`AuthorizationStartRateLimitFilter`).
 *
 * **여기 없는 값은 사유 없는 실패로 다룬다.** 서버는 제공자 응답에 계정 정보가 섞일 수 있어
 * 실패 사유를 그대로 노출하지 않으므로(SecurityConfig의 failureHandler), 대부분의 실패는
 * 파라미터 없이 온다. 화면이 사유를 지어내지 않는 것이 그 설계를 잇는 일이다.
 */
const 사유별문구: Readonly<Record<string, string>> = {
  unsupported: '지원하지 않는 로그인 방법입니다. 다른 방법으로 로그인해 주세요.',
  auth_otp_rate_limited: '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.',
};

const 기본문구 = '로그인을 완료하지 못했습니다. 다시 시도해 주세요.';

/**
 * 소셜 로그인 실패 랜딩 (AUTH-02·03).
 *
 * 사용자가 볼 수 있는 것은 "무엇을 할 수 있는가"뿐이다 — 다시 시도할 경로를 화면에 두는 것이
 * 이 페이지의 존재 이유다. 사유를 자세히 적어 주는 것은 여기서 이득이 아니라 위험이다.
 */
@Component({
  selector: 'app-social-error-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiAlert, UiButton, UiCard],
  host: { class: 'flex min-h-dvh items-center justify-center bg-background p-4' },
  template: `
    <ui-card class="w-full max-w-100">
      <header class="flex flex-col gap-1">
        <h1 class="t-headline-md">로그인 실패</h1>
      </header>

      <ui-alert intent="danger">{{ message() }}</ui-alert>

      @for (provider of providers; track provider.id) {
        <a ui-button size="lg" [href]="startUrl(provider)">{{ provider.label }} 다시 시도</a>
      }

      <a ui-button variant="tertiary" routerLink="/login">이메일로 로그인</a>
    </ui-card>
  `,
})
export class SocialErrorPage {
  /** 쿼리 파라미터 — `withComponentInputBinding()`이 연결한다(웹.md §6.1). */
  readonly reason = input<string>();

  protected readonly providers: readonly SocialProvider[] = SOCIAL_PROVIDERS;
  protected readonly startUrl = socialLoginStartUrl;

  protected message(): string {
    const 사유 = this.reason();
    return 사유 && 사유 in 사유별문구 ? 사유별문구[사유] : 기본문구;
  }
}
