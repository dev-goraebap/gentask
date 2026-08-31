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
  selector: 'app-login',
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
  templateUrl: './login-page.html',
})
export class LoginPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // --- 상태 --------------------------------------------------------------------------------------
  private readonly draft = signal({ email: '', password: '' });

  protected readonly loginForm = form(this.draft, (path) => {
    validate(path.email, ({ value }) =>
      value().trim() ? undefined : requiredError({ message: '이메일을 입력해 주세요' }),
    );
    validate(path.password, ({ value }) =>
      value() ? undefined : requiredError({ message: '비밀번호를 입력해 주세요' }),
    );
  });

  protected readonly failure = signal<string | null>(null);
  protected readonly busy = signal(false);

  // --- 동작 --------------------------------------------------------------------------------------
  protected async submit(): Promise<void> {
    this.loginForm().markAsTouched();
    if (!this.loginForm().valid()) return;

    this.busy.set(true);
    this.failure.set(null);
    try {
      const { email, password } = this.draft();
      await this.authService.login(email, password);
    } catch (error) {
      this.failure.set(problemDetail(error, '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요'));
      return;
    } finally {
      this.busy.set(false);
    }

    await this.router.navigateByUrl(this.routes.taskList());
  }
}
