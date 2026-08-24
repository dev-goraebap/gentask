import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthCommands } from '@/entities/user';
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
  host: { class: 'flex min-h-dvh items-center justify-center p-4' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="border-border bg-card w-full max-w-sm border p-6">
      <h1 class="text-xl font-semibold tracking-tight">로그인</h1>
      <p class="text-foreground-secondary mt-1 text-sm">내 목록으로 돌아갑니다.</p>

      <form
        novalidate
        [formRoot]="loginForm"
        (submit)="$event.preventDefault(); submit()"
        class="mt-6 flex flex-col gap-4"
      >
        <div hlmField>
          <label hlmFieldLabel for="login-email">이메일</label>
          <input
            hlmInput
            id="login-email"
            type="email"
            autocomplete="email"
            [formField]="loginForm.email"
          />
          @if (loginForm.email().touched()) {
            @for (error of loginForm.email().errors(); track error.kind) {
              <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
            }
          }
        </div>

        <div hlmField>
          <label hlmFieldLabel for="login-password">비밀번호</label>
          <input
            hlmInput
            id="login-password"
            type="password"
            autocomplete="current-password"
            [formField]="loginForm.password"
          />
          @if (loginForm.password().touched()) {
            @for (error of loginForm.password().errors(); track error.kind) {
              <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
            }
          }
        </div>

        @if (failure(); as message) {
          <p class="text-destructive text-sm" role="alert">{{ message }}</p>
        }

        <button hlmBtn type="submit" [disabled]="busy()">로그인</button>
      </form>

      <p class="text-foreground-secondary mt-4 text-sm">
        계정이 없나요?
        <a class="text-primary underline-offset-4 hover:underline" [routerLink]="routes.signup()"
          >등록</a
        >
      </p>
    </section>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthCommands);
  private readonly router = inject(Router);

  protected readonly routes = ROUTES;

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

  protected async submit(): Promise<void> {
    this.loginForm().markAsTouched();
    if (!this.loginForm().valid()) return;

    this.busy.set(true);
    this.failure.set(null);
    try {
      const { email, password } = this.draft();
      await this.auth.login(email, password);
    } catch (error) {
      this.failure.set(problemDetail(error, '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요'));
      return;
    } finally {
      this.busy.set(false);
    }

    await this.router.navigateByUrl(ROUTES.taskList());
  }
}
