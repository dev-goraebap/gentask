import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiError, toApiError } from '@/shared/api';
import {
  SOCIAL_PROVIDERS,
  SessionApi,
  SessionStore,
  type SocialProvider,
  socialLoginStartUrl,
} from '@/shared/auth';
import { UiAlert, UiButton, UiCard, UiField, UiInput, UiLink, UiOtpInput } from '@/shared/ui';

/** OTP 실패를 뜻하는 서버 코드. 이 경우에만 코드 입력 단계로 되돌린다. */
const OTP_오류코드 = new Set([
  'AUTH_OTP_INVALID',
  'AUTH_OTP_EXPIRED',
  'AUTH_OTP_ATTEMPTS_EXCEEDED',
]);

/**
 * 회원가입 (AUTH-01) — 이메일 → 확인 코드 → 비밀번호.
 *
 * **코드를 따로 검증하는 호출이 없다.** 서버 계약은 발급(`POST /email-verifications`)과
 * 완료(`POST /users`) 두 번이고, 코드는 비밀번호와 함께 완료 호출에서 검증된다
 * (설계/서버.md §1.6). 그래서 코드가 틀렸다는 사실은 마지막 단계에서야 알 수 있고,
 * 그때 코드 입력 단계로 되돌린다 — 사용자가 방금 정한 비밀번호는 그대로 남긴다.
 *
 * 단계를 셋으로 나눈 이유는 화면 하나에 다 담으면 "코드를 아직 못 받았는데 비밀번호까지
 * 보이는" 상태가 되기 때문이다. 흐름이 곧 안내가 된다.
 */
@Component({
  selector: 'app-signup-page',
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
      <header class="flex flex-col gap-1">
        <h1 class="t-headline-md">회원가입</h1>
        <p class="t-body-sm text-fg-muted">{{ stepHint() }}</p>
      </header>

      @if (error(); as message) {
        <ui-alert intent="danger">{{ message }}</ui-alert>
      }

      @switch (step()) {
        @case ('email') {
          <form [formGroup]="emailForm" (ngSubmit)="sendCode()" class="flex flex-col gap-4">
            <ui-field
              label="이메일"
              hint="이 주소로 6자리 확인 코드를 보냅니다."
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
        }

        @case ('code') {
          <!-- 이 단계에는 폼 그룹이 없다. ngSubmit은 NgForm·FormGroupDirective가 있을 때만
               발생하는 출력이라, 여기서 쓰면 아무 일도 일어나지 않는 조용한 버그가 된다. -->
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
            <ui-field label="비밀번호" hint="8자 이상" [error]="passwordError()">
              <input
                ui-input
                type="password"
                formControlName="password"
                autocomplete="new-password"
              />
            </ui-field>

            <ui-field label="비밀번호 확인" [error]="confirmError()">
              <input
                ui-input
                type="password"
                formControlName="confirm"
                autocomplete="new-password"
              />
            </ui-field>

            <button ui-button type="submit" variant="primary" size="lg" [loading]="busy()">
              가입 완료
            </button>
          </form>
        }
      }

      <!-- 제공자 가입은 첫 단계에서만 권한다. 코드·비밀번호를 입력하는 중에 다른 경로를
           보여주면 지금 하던 것을 버리라는 신호가 된다. -->
      @if (step() === 'email') {
        <div class="flex items-center gap-3">
          <span class="h-px flex-1 bg-border"></span>
          <span class="t-body-sm text-fg-faint">또는</span>
          <span class="h-px flex-1 bg-border"></span>
        </div>

        @for (provider of providers; track provider.id) {
          <a ui-button size="lg" [href]="startUrl(provider)">{{ provider.label }}</a>
        }
      }

      <p class="t-body-sm text-fg-muted">
        이미 계정이 있으신가요? <a ui-link routerLink="/login">로그인</a>
      </p>
    </ui-card>
  `,
})
export class SignupPage {
  private readonly api = inject(SessionApi);
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  /** 대기 레코드 식별자. 인증 자격이 아니라 검증 호출의 핸들이다(설계/서버.md §1.6). */
  private verificationId = '';

  protected readonly providers: readonly SocialProvider[] = SOCIAL_PROVIDERS;
  protected readonly startUrl = socialLoginStartUrl;

  protected readonly step = signal<'email' | 'code' | 'password'>('email');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly codeError = signal<string | null>(null);
  protected readonly code = signal('');

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly passwordForm = this.fb.nonNullable.group({
    // 상한 72는 서버와 같은 값이다 — bcrypt가 그 이상을 무시하므로 조용히 자르지 않고 거부한다
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirm: ['', [Validators.required]],
  });

  protected stepHint(): string {
    switch (this.step()) {
      case 'email':
        return '가입에 사용할 이메일을 입력해 주세요.';
      case 'code':
        return '메일로 받은 6자리 코드를 입력해 주세요.';
      case 'password':
        return '사용할 비밀번호를 정해 주세요.';
    }
  }

  /**
   * 코드를 보낸 주소를 다시 보여준다.
   *
   * "메일을 보냈습니다"만 있으면 오타를 알아챌 방법이 없다 — 사용자가 확인할 수 있는 유일한
   * 단서는 자기가 입력한 주소다. 계정 존재 여부를 노출하는 것이 아니므로 공통 규칙과
   * 충돌하지 않는다.
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

  /** 코드 재발송. 새 대기 레코드가 생기므로 이전 식별자는 버린다. */
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
    // 일치 여부를 `confirmError()`로 판정하지 않는다 — 그 함수는 touched일 때만 문구를
    // 내주므로, 제출 시점의 검사를 거기에 기대면 한 번도 건드리지 않은 칸을 통과시킨다
    if (this.passwordForm.invalid || password !== confirm) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.error.set(null);

    try {
      await this.api.signup(this.verificationId, this.code(), password);
      // 가입과 동시에 로그인 상태가 된다 — 서버가 세션 토큰을 새로 발급한다(AUTH-01)
      await this.store.refresh();
      await this.router.navigateByUrl('/app');
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
      const 대기 = await this.api.issueSignupVerification(this.emailForm.getRawValue().email);
      this.verificationId = 대기.verificationId;
      다음?.();
    } catch (error) {
      this.error.set(toApiError(error).message);
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * 실패를 어느 단계로 되돌릴지 가른다.
   *
   * OTP 실패를 비밀번호 화면에 문구로만 띄우면 사용자가 고칠 수 있는 칸이 화면에 없다 —
   * 고칠 대상이 있는 자리로 데려가는 것이 에러 처리의 일이다.
   */
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
