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
  host: { class: 'flex min-h-dvh items-center justify-center p-4' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="border-border bg-card w-full max-w-sm border p-6">
      <h1 class="text-xl font-semibold tracking-tight">계정 등록</h1>
      <p class="text-foreground-secondary mt-1 text-sm">내 작업이 내 계정에 묶입니다.</p>

      <form
        novalidate
        [formRoot]="signupForm"
        (submit)="$event.preventDefault(); submit()"
        class="mt-6 flex flex-col gap-4"
      >
        <div hlmField>
          <label hlmFieldLabel for="signup-email">이메일</label>
          <input
            hlmInput
            id="signup-email"
            type="email"
            autocomplete="email"
            [formField]="signupForm.email"
          />
          @if (signupForm.email().touched()) {
            @for (error of signupForm.email().errors(); track error.kind) {
              <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
            }
          }
        </div>

        <div hlmField>
          <label hlmFieldLabel for="signup-password">비밀번호</label>
          <input
            hlmInput
            id="signup-password"
            type="password"
            autocomplete="new-password"
            [formField]="signupForm.password"
          />
          @if (signupForm.password().touched()) {
            @for (error of signupForm.password().errors(); track error.kind) {
              <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
            }
          }
        </div>

        @if (failure(); as message) {
          <p class="text-destructive text-sm" role="alert">{{ message }}</p>
        }

        <button hlmBtn type="submit" [disabled]="busy()">등록</button>
      </form>

      <p class="text-foreground-secondary mt-4 text-sm">
        이미 계정이 있나요?
        <a class="text-primary underline-offset-4 hover:underline" [routerLink]="routes.login()"
          >로그인</a
        >
      </p>
    </section>
  `,
})
export class SignupPage {
  private static readonly PASSWORD_MIN = 8;

  private readonly auth = inject(AuthCommands);
  private readonly router = inject(Router);

  protected readonly routes = ROUTES;

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

  protected async submit(): Promise<void> {
    this.signupForm().markAsTouched();
    if (!this.signupForm().valid()) return;

    this.busy.set(true);
    this.failure.set(null);
    try {
      const { email, password } = this.draft();
      await this.auth.signup(email, password);
    } catch (error) {
      this.failure.set(problemDetail(error, '등록하지 못했습니다. 잠시 후 다시 시도해 주세요'));
      return;
    } finally {
      this.busy.set(false);
    }

    await this.router.navigateByUrl(ROUTES.taskList());
  }
}
