import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@/entities/user';
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
  private static readonly PASSWORD_MIN = 8;
  protected readonly routes = ROUTES;

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // --- 상태 --------------------------------------------------------------------------------------
  private readonly draft = signal({ email: '', password: '' });

  protected readonly signupForm = form(this.draft, (path) => {
    validate(path.email, ({ value }) => {
      const email = value().trim();
      if (!email) return requiredError({ message: '이메일을 입력해 주세요' });
      return email.includes('@') ? undefined : requiredError({ message: '이메일 형식이 아닙니다' });
    });
    validate(path.password, ({ value }) =>
      value().length >= SignupPage.PASSWORD_MIN
        ? undefined
        : requiredError({ message: '비밀번호는 8자 이상이어야 합니다' }),
    );
  });

  protected readonly failure = signal<string | null>(null);
  protected readonly busy = signal(false);

  // --- 동작 --------------------------------------------------------------------------------------
  protected async submit(): Promise<void> {
    this.signupForm().markAsTouched();
    if (!this.signupForm().valid()) return;

    this.busy.set(true);
    this.failure.set(null);
    try {
      const { email, password } = this.draft();
      await this.authService.signup(email, password);
    } catch (error) {
      this.failure.set(problemDetail(error, '등록하지 못했습니다. 잠시 후 다시 시도해 주세요'));
      return;
    } finally {
      this.busy.set(false);
    }

    await this.router.navigateByUrl(this.routes.taskList());
  }
}
