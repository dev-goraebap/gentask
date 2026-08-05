import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { toApiError } from '@/shared/api';
import {
  REASON_UNAVAILABLE,
  SOCIAL_PROVIDERS,
  SessionApi,
  SessionStore,
  type SocialProvider,
  socialLoginStartUrl,
} from '@/shared/auth';
import { UiAlert, UiButton, UiCard, UiField, UiInput, UiLink } from '@/shared/ui';

/**
 * 로그인 (AUTH-01) + 제공자 버튼 (AUTH-02·03).
 *
 * 실패 문구를 서버가 준 그대로 쓴다. 서버는 "이메일이 없음"과 "비밀번호가 틀림"을 구분해
 * 노출하지 않으므로(AUTH-01 인수조건), 화면이 친절을 더하려고 사유를 추측하면 그 순간
 * 계정 열거 오라클이 된다.
 */
@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, UiAlert, UiButton, UiCard, UiField, UiInput, UiLink],
  host: { class: 'flex min-h-dvh items-center justify-center bg-background p-4' },
  template: `
    <ui-card class="w-full max-w-100">
      <header class="flex flex-col gap-1">
        <h1 class="t-headline-md">로그인</h1>
        <p class="t-body-sm text-fg-muted">이메일과 비밀번호를 입력해 주세요.</p>
      </header>

      @if (reason() === REASON_UNAVAILABLE) {
        <ui-alert intent="warning" title="세션을 확인하지 못했습니다">
          일시적인 문제일 수 있습니다. 잠시 후 다시 시도해 주세요.
        </ui-alert>
      }

      @if (error(); as message) {
        <ui-alert intent="danger">{{ message }}</ui-alert>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
        <ui-field label="이메일" [error]="emailError()">
          <input
            ui-input
            type="email"
            formControlName="email"
            autocomplete="email"
            placeholder="you@example.com"
          />
        </ui-field>

        <ui-field label="비밀번호" [error]="passwordError()">
          <input
            ui-input
            type="password"
            formControlName="password"
            autocomplete="current-password"
          />
        </ui-field>

        <button ui-button type="submit" variant="primary" size="lg" [loading]="submitting()">
          로그인
        </button>
      </form>

      <!-- 로그인할 수 없는 사람이 여기서 길을 잃지 않게 두 복구 경로를 함께 둔다(AUTH-07·08).
           둘의 차이는 "비밀번호를 잊었나"와 "인증 수단 자체를 잃었나"다. -->
      <p class="t-body-sm text-fg-muted">
        <a ui-link routerLink="/password-reset">비밀번호를 잊으셨나요?</a>
        ·
        <a ui-link routerLink="/account-recovery">로그인 수단을 잃으셨나요?</a>
      </p>

      <div class="flex items-center gap-3">
        <span class="h-px flex-1 bg-border"></span>
        <span class="t-body-sm text-fg-faint">또는</span>
        <span class="h-px flex-1 bg-border"></span>
      </div>

      <!-- routerLink가 아니라 href다. SPA 안에서 라우팅하면 서버에 도달하지 않아 아무 일도
           일어나지 않는다 — 제공자로 가는 302를 브라우저가 따라가야 한다. -->
      @for (provider of providers; track provider.id) {
        <a ui-button size="lg" [href]="startUrl(provider)">{{ provider.label }}</a>
      }

      <p class="t-body-sm text-fg-muted">
        계정이 없으신가요? <a ui-link routerLink="/signup">회원가입</a>
      </p>
    </ui-card>
  `,
})
export class LoginPage {
  private readonly api = inject(SessionApi);
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);

  /**
   * 쿼리 파라미터를 `withComponentInputBinding()`으로 받는다 — `ActivatedRoute`를 주입하지
   * 않는다(웹.md §6.1).
   */
  readonly returnUrl = input<string>();
  readonly reason = input<string>();

  protected readonly REASON_UNAVAILABLE = REASON_UNAVAILABLE;
  protected readonly providers: readonly SocialProvider[] = SOCIAL_PROVIDERS;
  protected readonly startUrl = socialLoginStartUrl;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected emailError(): string | undefined {
    const control = this.form.controls.email;
    if (!control.touched || control.valid) return undefined;
    return control.hasError('required') ? '이메일을 입력해 주세요.' : '이메일 형식이 아닙니다.';
  }

  protected passwordError(): string | undefined {
    const control = this.form.controls.password;
    return control.touched && control.invalid ? '비밀번호를 입력해 주세요.' : undefined;
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      // 표시는 touched를 보고 결정하므로, 건드리지 않은 칸의 오류도 함께 드러나게 한다
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    try {
      await this.api.login(email, password);
      await this.store.refresh();
      await this.router.navigateByUrl(this.복귀경로());
    } catch (error) {
      this.error.set(toApiError(error).message);
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * 로그인 후 돌아갈 곳. **쿼리 파라미터를 그대로 믿지 않는다.**
   *
   * `returnUrl`은 링크 한 줄로 누구나 심을 수 있는 값이다. 검사 없이 넘기면
   * `/login?returnUrl=https://evil.example`가 우리 도메인의 로그인을 거쳐 외부로 보내는
   * 오픈 리다이렉트가 된다 — 피싱에서 즐겨 쓰는 형태다.
   *
   * `//evil.example`와 `/\evil.example`은 브라우저가 프로토콜 상대 URL로 해석해 외부로
   * 나가므로 슬래시로 시작하는지만 보는 검사로는 부족하다.
   */
  private 복귀경로(): string {
    const 요청 = this.returnUrl();
    if (!요청 || !요청.startsWith('/')) return '/app';
    if (요청.startsWith('//') || 요청.startsWith('/\\')) return '/app';
    return 요청;
  }
}
