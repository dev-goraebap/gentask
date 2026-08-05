import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiError, toApiError } from '@/shared/api';
import { SessionApi, SessionStore } from '@/shared/auth';
import { UiAlert, UiButton, UiCard, UiField, UiInput, UiLink, UiOtpInput } from '@/shared/ui';

/** 표가 없거나 이미 쓰였다는 뜻. 이 경우에만 "처음부터 다시"로 안내한다. */
const TICKET_INVALID = 'AUTH_SOCIAL_TICKET_INVALID';

/** OTP 실패 — 코드 입력 단계에 머문다. */
const OTP_오류코드 = new Set([
  'AUTH_OTP_INVALID',
  'AUTH_OTP_EXPIRED',
  'AUTH_OTP_ATTEMPTS_EXCEEDED',
]);

/**
 * 소셜 최초 로그인의 2단계 화면 (AUTH-02·03·05).
 *
 * 제공자 인증을 마친 사용자가 여기로 리다이렉트되어 온다. **제공자가 이메일을 증명해주지
 * 않으므로**(결정-0015) 이메일을 입력받아 우리 OTP로 소유를 증명한다.
 *
 * **표는 화면이 들고 있지 않다.** 제공자 인증과 이 화면을 잇는 중간 표는 `HttpOnly` 쿠키로만
 * 오가며 자바스크립트가 볼 수 없다(보안 검토 F1). 화면이 할 일은 이메일과 코드를 받는 것뿐이다.
 *
 * **"코드 다시 받기"가 없다.** 서버가 이메일 요청 응답에서 표 쿠키를 지우기 때문에
 * (`SocialLoginController.requestEmail`, 보안 검토 F4) 같은 표로 두 번 요청할 수 없다.
 * 재시도는 제공자 인증부터 다시이며, 화면은 그 사실을 숨기지 않고 그렇게 안내한다.
 */
@Component({
  selector: 'app-social-email-page',
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
        <h1 class="t-headline-md">이메일 확인</h1>
        <p class="t-body-sm text-fg-muted">
          {{
            step() === 'email'
              ? '사용할 이메일을 입력해 주세요. 소유 확인을 거쳐 계정이 만들어집니다.'
              : '메일로 받은 6자리 코드를 입력해 주세요.'
          }}
        </p>
      </header>

      @if (restartNeeded()) {
        <ui-alert intent="warning" title="처음부터 다시 시작해 주세요">
          로그인 정보가 만료되었습니다. 로그인 화면에서 다시 시도해 주세요.
        </ui-alert>
        <a ui-button variant="primary" size="lg" routerLink="/login">로그인 화면으로</a>
      } @else {
        @if (error(); as message) {
          <ui-alert intent="danger">{{ message }}</ui-alert>
        }

        @if (step() === 'email') {
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
              가입 완료
            </button>
          </form>

          <!-- 코드를 받지 못하는 경우가 둘이고, 우리는 어느 쪽인지 말해 줄 수 없다.
               계정이 이미 있으면 서버가 코드 대신 안내 메일을 보내며 응답은 똑같기 때문이다
               (AUTH-05). 그래서 두 경우에 다 통하는 다음 행동만 알려준다. -->
          <p class="t-body-sm text-fg-muted">
            코드가 오지 않았나요? 이미 가입된 주소라면 코드 대신 안내 메일이 갑니다 — 그때는
            <a ui-link routerLink="/login">기존에 쓰던 로그인 방법</a>으로 로그인해 주세요.
          </p>
        }
      }
    </ui-card>
  `,
})
export class SocialEmailPage {
  private readonly api = inject(SessionApi);
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  private verificationId = '';

  protected readonly step = signal<'email' | 'code'>('email');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly codeError = signal<string | null>(null);
  protected readonly restartNeeded = signal(false);
  protected readonly code = signal('');

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

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

    this.busy.set(true);
    this.error.set(null);

    try {
      const 대기 = await this.api.requestSocialEmail(this.emailForm.getRawValue().email);
      this.verificationId = 대기.verificationId;
      this.step.set('code');
    } catch (error) {
      this.실패처리(toApiError(error));
    } finally {
      this.busy.set(false);
    }
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
      await this.api.confirmSocialSignup(this.verificationId, this.code());
      // 여기서 비로소 user와 소셜 account가 함께 생기고 세션이 발급된다(결정-0015 §결정 4)
      await this.store.refresh();
      await this.router.navigateByUrl('/app');
    } catch (error) {
      this.실패처리(toApiError(error));
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * 표가 죽은 것과 코드가 틀린 것을 가른다.
   *
   * 표가 죽었으면 이 화면에서 할 수 있는 일이 없다 — 입력을 고쳐도 통과하지 못하므로 폼을
   * 치우고 시작점으로 보낸다. 폼을 남겨 두면 사용자가 같은 실패를 반복한다.
   */
  private 실패처리(error: ApiError): void {
    if (error.code === TICKET_INVALID) {
      this.restartNeeded.set(true);
      return;
    }
    if (error.code && OTP_오류코드.has(error.code)) {
      this.codeError.set(error.message);
      this.code.set('');
      return;
    }
    this.error.set(error.message);
  }
}
