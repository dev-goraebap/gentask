import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService, describePasswordViolation, PASSWORD_RULE_HINT } from '@/entities/user';
import { problemDetail } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { HlmButton } from '@/shared/ui/button';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@/shared/ui/field';
import { HlmInput } from '@/shared/ui/input';

@Component({
  selector: 'app-password-reset',
  imports: [
    FormRoot,
    FormField,
    RouterLink,
    HlmButton,
    HlmInput,
    HlmField,
    HlmFieldError,
    HlmFieldLabel,
  ],
  host: { class: 'flex min-h-dvh' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-reset-page.html',
})
export class PasswordResetPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;
  protected readonly passwordHint = PASSWORD_RULE_HINT;

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // --- 상태 --------------------------------------------------------------------------------------
  protected readonly stage = signal<'email' | 'code'>('email');
  protected readonly sentTo = signal('');

  private readonly emailDraft = signal({ email: '' });
  private readonly resetDraft = signal({ code: '', newPassword: '' });

  protected readonly emailForm = form(this.emailDraft, (path) => {
    validate(path.email, ({ value }) => {
      const email = value().trim();
      if (!email) return requiredError({ message: '이메일을 입력해 주세요' });
      return email.includes('@') ? undefined : requiredError({ message: '이메일 형식이 아닙니다' });
    });
  });

  protected readonly resetForm = form(this.resetDraft, (path) => {
    validate(path.code, ({ value }) =>
      value().trim() ? undefined : requiredError({ message: '받은 코드를 입력해 주세요' }),
    );
    validate(path.newPassword, ({ value }) => {
      const violation = describePasswordViolation(value());
      return violation ? requiredError({ message: violation }) : undefined;
    });
  });

  protected readonly failure = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busy = signal(false);

  // --- 동작 --------------------------------------------------------------------------------------
  /** 그 주소로 계정이 있든 없든 같은 자리로 넘어간다. 구분해 알리면 가입 여부가 드러난다. */
  protected async request(): Promise<void> {
    this.emailForm().markAsTouched();
    if (!this.emailForm().valid()) return;

    const email = this.emailDraft().email.trim();
    const done = await this.run(
      () => this.authService.requestPasswordReset(email),
      '코드를 보내지 못했습니다. 잠시 후 다시 시도해 주세요',
    );
    if (done) {
      this.sentTo.set(email);
      this.stage.set('code');
      this.notice.set(null);
    }
  }

  protected async confirm(): Promise<void> {
    this.resetForm().markAsTouched();
    if (!this.resetForm().valid()) return;

    const { code, newPassword } = this.resetDraft();
    const done = await this.run(
      () => this.authService.confirmPasswordReset(this.sentTo(), code.trim(), newPassword),
      '비밀번호를 바꾸지 못했습니다',
    );
    // 앞서 열린 자리를 모두 거두었으므로 새 비밀번호로 다시 들어와야 한다.
    if (done) await this.router.navigateByUrl(this.routes.login());
  }

  protected async resend(): Promise<void> {
    const done = await this.run(
      () => this.authService.resendPasswordResetCode(this.sentTo()),
      '코드를 다시 보내지 못했습니다',
    );
    if (done) this.notice.set('코드를 다시 보냈습니다.');
  }

  protected back(): void {
    this.stage.set('email');
    this.failure.set(null);
    this.notice.set(null);
  }

  // --- 보조 --------------------------------------------------------------------------------------
  private async run(action: () => Promise<void>, fallback: string): Promise<boolean> {
    this.busy.set(true);
    this.failure.set(null);
    try {
      await action();
      return true;
    } catch (error) {
      this.failure.set(problemDetail(error, fallback));
      return false;
    } finally {
      this.busy.set(false);
    }
  }
}
