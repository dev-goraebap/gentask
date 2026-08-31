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
  selector: 'app-signup',
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
  templateUrl: './signup-page.html',
})
export class SignupPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;
  protected readonly passwordHint = PASSWORD_RULE_HINT;

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // --- 상태 --------------------------------------------------------------------------------------
  /** 자격을 적는 단계와 받은 코드를 적는 단계. 계정은 두 번째가 끝나야 생긴다. */
  protected readonly stage = signal<'credentials' | 'code'>('credentials');
  protected readonly sentTo = signal('');

  private readonly draft = signal({ email: '', password: '' });
  private readonly codeDraft = signal({ code: '' });

  protected readonly signupForm = form(this.draft, (path) => {
    validate(path.email, ({ value }) => {
      const email = value().trim();
      if (!email) return requiredError({ message: '이메일을 입력해 주세요' });
      return email.includes('@') ? undefined : requiredError({ message: '이메일 형식이 아닙니다' });
    });
    validate(path.password, ({ value }) => {
      const violation = describePasswordViolation(value());
      return violation ? requiredError({ message: violation }) : undefined;
    });
  });

  protected readonly codeForm = form(this.codeDraft, (path) => {
    validate(path.code, ({ value }) =>
      value().trim() ? undefined : requiredError({ message: '받은 코드를 입력해 주세요' }),
    );
  });

  protected readonly failure = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busy = signal(false);

  // --- 동작 --------------------------------------------------------------------------------------
  protected async submit(): Promise<void> {
    this.signupForm().markAsTouched();
    if (!this.signupForm().valid()) return;

    const { email, password } = this.draft();
    await this.run(async () => {
      await this.authService.requestSignup(email, password);
      this.sentTo.set(email.trim());
      this.stage.set('code');
      this.notice.set(null);
    }, '등록하지 못했습니다. 잠시 후 다시 시도해 주세요');
  }

  protected async confirm(): Promise<void> {
    this.codeForm().markAsTouched();
    if (!this.codeForm().valid()) return;

    const done = await this.run(async () => {
      await this.authService.confirmSignup(this.sentTo(), this.codeDraft().code.trim());
    }, '코드를 확인하지 못했습니다');
    if (done) await this.router.navigateByUrl(this.routes.taskList());
  }

  protected async resend(): Promise<void> {
    const done = await this.run(
      () => this.authService.resendSignupCode(this.sentTo()),
      '코드를 다시 보내지 못했습니다',
    );
    if (done) {
      this.codeDraft.set({ code: '' });
      this.notice.set('코드를 다시 보냈습니다.');
    }
  }

  /** 앞의 단계로 돌아간다. 적어 둔 자격은 그대로 두어 다시 치지 않게 한다. */
  protected back(): void {
    this.stage.set('credentials');
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
