import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiError, toApiError } from '@/shared/api';
import { SessionApi, SessionStore } from '@/shared/auth';
import { UiAlert, UiButton, UiCard, UiField, UiInput, UiLink, UiOtpInput } from '@/shared/ui';

/** OTP 실패 — 코드 입력 단계로 되돌린다. */
const OTP_오류코드 = new Set([
  'AUTH_OTP_INVALID',
  'AUTH_OTP_EXPIRED',
  'AUTH_OTP_ATTEMPTS_EXCEEDED',
]);

/**
 * 비밀번호 재설정 (AUTH-07) — 이메일 → 확인 코드 → 새 비밀번호.
 *
 * **로그인할 수 없는 상태의 복구 경로다.** 로그인된 상태의 비밀번호 변경은 PROF-03이며 아직 없다.
 *
 * 가입과 같은 3단계 구조인 이유도 같다 — 코드를 아직 받지 못했는데 비밀번호 칸까지 보이면
 * 지금 무엇을 해야 하는지 흐려진다. 코드 검증도 마찬가지로 완료 호출에 묶여 있어(서버 계약)
 * 코드가 틀렸다는 사실은 마지막에 드러나며, 그때 코드 입력으로 되돌린다.
 *
 * **성공하면 그 사용자의 모든 세션이 끊긴다** — 재설정을 요청한 세션까지 포함이다(AUTH-07).
 * 조용히 넘어가면 사용자는 다음 화면에서 영문 모를 401을 만나므로, 완료 화면이 그 사실을
 * 먼저 알린다.
 */
@Component({
  selector: 'app-password-reset-page',
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
          <h1 class="t-headline-md">비밀번호를 변경했습니다</h1>
        </header>

        <ui-alert intent="info" title="모든 기기에서 로그아웃되었습니다">
          보안을 위해 기존 로그인이 전부 해제되었습니다. 새 비밀번호로 다시 로그인해 주세요.
        </ui-alert>

        <a ui-button variant="primary" size="lg" routerLink="/login">로그인 화면으로</a>
      } @else {
        <header class="flex flex-col gap-1">
          <h1 class="t-headline-md">비밀번호 재설정</h1>
          <p class="t-body-sm text-fg-muted">{{ stepHint() }}</p>
        </header>

        @if (error(); as message) {
          <ui-alert intent="danger">{{ message }}</ui-alert>
        }

        @switch (step()) {
          @case ('email') {
            <form [formGroup]="emailForm" (ngSubmit)="sendCode()" class="flex flex-col gap-4">
              <ui-field label="이메일" [error]="emailError()">
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
          }

          @case ('code') {
            <form (submit)="$event.preventDefault(); confirmCode()" class="flex flex-col gap-4">
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
                [disabled]="code().length < 6"
              >
                다음
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

          @case ('password') {
            <form [formGroup]="passwordForm" (ngSubmit)="complete()" class="flex flex-col gap-4">
              <ui-field label="새 비밀번호" hint="8자 이상" [error]="passwordError()">
                <input
                  ui-input
                  type="password"
                  formControlName="password"
                  autocomplete="new-password"
                />
              </ui-field>

              <ui-field label="새 비밀번호 확인" [error]="confirmError()">
                <input
                  ui-input
                  type="password"
                  formControlName="confirm"
                  autocomplete="new-password"
                />
              </ui-field>

              <button ui-button type="submit" variant="primary" size="lg" [loading]="busy()">
                비밀번호 변경
              </button>
            </form>
          }
        }

        <p class="t-body-sm text-fg-muted">
          비밀번호가 기억났나요? <a ui-link routerLink="/login">로그인</a>
        </p>
      }
    </ui-card>
  `,
})
export class PasswordResetPage {
  private readonly api = inject(SessionApi);
  private readonly store = inject(SessionStore);
  private readonly fb = inject(FormBuilder);

  private verificationId = '';

  protected readonly step = signal<'email' | 'code' | 'password' | 'done'>('email');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly codeError = signal<string | null>(null);
  protected readonly code = signal('');

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirm: ['', [Validators.required]],
  });

  protected stepHint(): string {
    switch (this.step()) {
      case 'email':
        return '가입한 이메일을 입력하면 확인 코드를 보내드립니다.';
      case 'code':
        return '메일로 받은 6자리 코드를 입력해 주세요.';
      default:
        return '새로 쓸 비밀번호를 정해 주세요.';
    }
  }

  /**
   * 계정이 없어도 같은 화면으로 넘어간다.
   *
   * 서버는 계정이 없을 때도 식별자를 돌려주고 아무도 맞힐 수 없는 대기 레코드를 남긴다 —
   * 응답만으로 두 경우를 구분할 수 없게 만든 설계다(AUTH-07). 화면이 "가입되지 않은
   * 이메일입니다"를 만들어내면 그 설계가 무너진다.
   */
  protected sentTo(): string {
    return `${this.emailForm.getRawValue().email} 으로 코드를 보냈습니다.`;
  }

  protected emailError(): string | undefined {
    const control = this.emailForm.controls.email;
    if (!control.touched || control.valid) return undefined;
    return control.hasError('required') ? '이메일을 입력해 주세요.' : '이메일 형식이 아닙니다.';
  }

  protected passwordError(): string | undefined {
    const control = this.passwordForm.controls.password;
    if (!control.touched || control.valid) return undefined;
    if (control.hasError('required')) return '비밀번호를 입력해 주세요.';
    if (control.hasError('minlength')) return '8자 이상으로 정해 주세요.';
    return '72자를 넘을 수 없습니다.';
  }

  protected confirmError(): string | undefined {
    const { password, confirm } = this.passwordForm.getRawValue();
    if (!this.passwordForm.controls.confirm.touched) return undefined;
    if (!confirm) return '비밀번호를 한 번 더 입력해 주세요.';
    return password === confirm ? undefined : '비밀번호가 일치하지 않습니다.';
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

  protected confirmCode(): void {
    if (this.code().length < 6) {
      this.codeError.set('6자리를 모두 입력해 주세요.');
      return;
    }
    this.codeError.set(null);
    this.step.set('password');
  }

  protected async complete(): Promise<void> {
    const { password, confirm } = this.passwordForm.getRawValue();
    if (this.passwordForm.invalid || password !== confirm) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.error.set(null);

    try {
      await this.api.confirmPasswordReset(this.verificationId, this.code(), password);
      // 서버가 전 세션을 끊었으므로 이 브라우저가 들고 있던 세션도 이미 죽었다.
      // 로컬 상태를 맞추지 않으면 화면만 로그인 상태로 남는다.
      this.store.markExpired();
      this.step.set('done');
    } catch (error) {
      this.실패처리(toApiError(error));
    } finally {
      this.busy.set(false);
    }
  }

  private async 발급(다음?: () => void): Promise<void> {
    this.busy.set(true);
    this.error.set(null);

    try {
      const 대기 = await this.api.issuePasswordReset(this.emailForm.getRawValue().email);
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
      this.step.set('code');
      return;
    }
    this.error.set(error.message);
  }
}
