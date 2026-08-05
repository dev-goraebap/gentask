import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiError, toApiError } from '@/shared/api';
import { SessionApi, SessionStore } from '@/shared/auth';
import { UiAlert, UiButton, UiCard, UiField, UiInput, UiLink, UiOtpInput } from '@/shared/ui';

/** OTP 실패 — 코드 입력 단계에 머문다. */
const OTP_오류코드 = new Set([
  'AUTH_OTP_INVALID',
  'AUTH_OTP_EXPIRED',
  'AUTH_OTP_ATTEMPTS_EXCEEDED',
]);

/**
 * 계정 복구 (AUTH-08) — 이메일 → 확인 코드 → 로그인.
 *
 * 소셜 전용 계정이 제공자 접근을 잃었을 때의 경로다. **비밀번호가 있는 계정에도 열려 있다** —
 * "비밀번호가 있으면 복구 불가"로 좁히면 그 거절 자체가 비밀번호 유무를 알려주는 신호가 된다.
 *
 * 이 경로는 비밀번호 없이 세션을 내주면서 기존 세션을 끊지 않으므로, **메일함 접근을 얻은
 * 사람이 조용히 들어올 수 있다.** 그래서 서버가 본인에게 알림 메일을 보내며 그것이 유일한
 * 사후 감지 신호다(AUTH-08). 화면은 그 사실을 가리지 않는다.
 */
@Component({
  selector: 'app-account-recovery-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    UiAlert,
    UiButton,
    UiCard,
    UiField,
    UiInput,
    UiLink,
    UiOtpInput,
  ],
  host: { class: 'flex min-h-dvh items-center justify-center bg-background p-4' },
  template: `
    <ui-card class="w-full max-w-100">
      @if (step() === 'done') {
        <header class="flex flex-col gap-1">
          <h1 class="t-headline-md">로그인되었습니다</h1>
        </header>

        <!-- 안내는 하되 없는 경로를 약속하지 않는다. 비밀번호 설정(PROF-03)이 생기면
             이 버튼이 그 화면으로 간다. -->
        <ui-alert intent="warning" title="이 계정에는 비밀번호가 없습니다">
          비밀번호를 설정해 두면 다음부터는 복구 절차 없이 로그인할 수 있습니다. 설정 화면은 준비
          중입니다.
        </ui-alert>

        <button ui-button variant="primary" size="lg" type="button" (click)="goToApp()">
          앱으로 이동
        </button>
      } @else {
        <header class="flex flex-col gap-1">
          <h1 class="t-headline-md">계정 복구</h1>
          <p class="t-body-sm text-fg-muted">{{ stepHint() }}</p>
        </header>

        @if (error(); as message) {
          <ui-alert intent="danger">{{ message }}</ui-alert>
        }

        @if (step() === 'email') {
          <form [formGroup]="emailForm" (ngSubmit)="sendCode()" class="flex flex-col gap-4">
            <ui-field
              label="이메일"
              hint="가입에 사용한 이메일로 확인 코드를 보냅니다."
              [error]="emailError()"
            >
              <input
                ui-input
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="you@example.com"
              />
            </ui-field>

            <button ui-button type="submit" variant="primary" size="lg" [loading]="busy()">
              확인 코드 받기
            </button>
          </form>
        } @else {
          <form (submit)="$event.preventDefault(); confirm()" class="flex flex-col gap-4">
            <ui-field label="확인 코드" [hint]="sentTo()">
              <ui-otp-input [(value)]="code" [invalid]="!!codeError()" />
            </ui-field>

            @if (codeError(); as message) {
              <p class="t-body-sm text-danger" role="alert">{{ message }}</p>
            }

            <button
              ui-button
              type="submit"
              variant="primary"
              size="lg"
              [loading]="busy()"
              [disabled]="code().length < 6"
            >
              로그인
            </button>
            <button
              ui-button
              type="button"
              variant="tertiary"
              [loading]="busy()"
              (click)="resend()"
            >
              코드 다시 받기
            </button>
          </form>
        }

        <p class="t-body-sm text-fg-muted">
          다른 방법으로 로그인할 수 있나요? <a ui-link routerLink="/login">로그인</a>
        </p>
      }
    </ui-card>
  `,
})
export class AccountRecoveryPage {
  private readonly api = inject(SessionApi);
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  private verificationId = '';

  protected readonly step = signal<'email' | 'code' | 'done'>('email');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly codeError = signal<string | null>(null);
  protected readonly code = signal('');

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected stepHint(): string {
    return this.step() === 'email'
      ? '인증 수단에 접근할 수 없을 때, 이메일로 로그인할 수 있습니다.'
      : '메일로 받은 6자리 코드를 입력해 주세요.';
  }

  protected sentTo(): string {
    return `${this.emailForm.getRawValue().email} 으로 코드를 보냈습니다.`;
  }

  protected emailError(): string | undefined {
    const control = this.emailForm.controls.email;
    if (!control.touched || control.valid) return undefined;
    return control.hasError('required') ? '이메일을 입력해 주세요.' : '이메일 형식이 아닙니다.';
  }

  protected async sendCode(): Promise<void> {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    await this.발급(() => this.step.set('code'));
  }

  protected async resend(): Promise<void> {
    this.code.set('');
    this.codeError.set(null);
    await this.발급();
  }

  protected async confirm(): Promise<void> {
    if (this.code().length < 6) {
      this.codeError.set('6자리를 모두 입력해 주세요.');
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    this.codeError.set(null);

    try {
      const 결과 = await this.api.confirmAccountRecovery(this.verificationId, this.code());
      await this.store.refresh();

      // 비밀번호가 있는 계정이면 안내할 것이 없다 — 그대로 앱으로 보낸다.
      // 없는 계정만 완료 화면에 세워 비밀번호 설정을 권한다(AUTH-08).
      if (결과.shouldSetPassword) {
        this.step.set('done');
        return;
      }
      await this.goToApp();
    } catch (error) {
      this.실패처리(toApiError(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async goToApp(): Promise<void> {
    await this.router.navigateByUrl('/app');
  }

  private async 발급(다음?: () => void): Promise<void> {
    this.busy.set(true);
    this.error.set(null);

    try {
      const 대기 = await this.api.issueAccountRecovery(this.emailForm.getRawValue().email);
      this.verificationId = 대기.verificationId;
      다음?.();
    } catch (error) {
      this.error.set(toApiError(error).message);
    } finally {
      this.busy.set(false);
    }
  }

  private 실패처리(error: ApiError): void {
    if (error.code && OTP_오류코드.has(error.code)) {
      this.codeError.set(error.message);
      this.code.set('');
      return;
    }
    this.error.set(error.message);
  }
}
