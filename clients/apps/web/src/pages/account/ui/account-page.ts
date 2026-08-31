import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { PushService } from '../api/push-service';
import {
  AuthService,
  describePasswordViolation,
  PASSWORD_RULE_HINT,
  UserAvatar,
  UserService,
} from '@/entities/user';
import { injectAttachmentPresign, problemDetail } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { openUppyDialog } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@/shared/ui/field';
import { HlmInput } from '@/shared/ui/input';
import { toast } from '@/shared/ui/sonner';
import { Veil } from '@/shared/ui/veil';

const MAX_IMAGE_BYTES = 1 * 1024 * 1024;

@Component({
  selector: 'app-account',
  imports: [
    FormRoot,
    FormField,
    HlmButton,
    HlmInput,
    HlmField,
    HlmFieldError,
    HlmFieldLabel,
    UserAvatar,
    Veil,
  ],
  host: {
    class: 'flex min-h-0 flex-1 flex-col',
    '[attr.aria-busy]': 'veilLoading() || null',
  },
  providers: [PushService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-page.html',
})
export class AccountPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly passwordHint = PASSWORD_RULE_HINT;

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly userService = inject(UserService);
  private readonly presign = injectAttachmentPresign();
  private readonly authService = inject(AuthService);
  private readonly pushService = inject(PushService);
  private readonly router = inject(Router);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly pushState = this.pushService.state;

  // --- 상태 --------------------------------------------------------------------------------------
  protected readonly issuedToken = signal<string | null>(null);
  private readonly draft = signal({ nickname: '' });

  protected readonly nicknameForm = form(this.draft, (path) => {
    validate(path.nickname, ({ value }) =>
      value().trim() ? undefined : requiredError({ message: '별명을 입력해 주세요' }),
    );
  });

  private readonly passwordDraft = signal({ currentPassword: '', newPassword: '' });

  protected readonly passwordForm = form(this.passwordDraft, (path) => {
    validate(path.currentPassword, ({ value }) =>
      value() ? undefined : requiredError({ message: '현재 비밀번호를 입력해 주세요' }),
    );
    validate(path.newPassword, ({ value }) => {
      const violation = describePasswordViolation(value());
      return violation ? requiredError({ message: violation }) : undefined;
    });
  });

  protected readonly changingPassword = signal(false);

  private readonly loaded = signal<string | null>(null);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly me = this.userService.me;
  protected readonly veilLoading = computed(() => this.userService.status() === 'loading');
  protected readonly veilFailed = computed(() => this.userService.status() === 'error');

  protected readonly joinedAt = computed(() => {
    const user = this.me();
    return user ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '';
  });

  protected readonly tokenIssuedAt = computed(() => {
    const at = this.me()?.apiTokenIssuedAt;
    return at ? new Date(at).toLocaleString('ko-KR') : '';
  });

  // --- 생성 --------------------------------------------------------------------------------------
  constructor() {
    effect(() => {
      const user = this.me();
      if (!user || untracked(this.loaded) === user.id) return;
      this.loaded.set(user.id);
      this.draft.set({ nickname: user.nickname });
    });
    void this.pushService.refresh();
  }

  // --- 동작 --------------------------------------------------------------------------------------
  protected async commitNickname(): Promise<void> {
    const user = this.me();
    if (!user) return;

    this.nicknameForm().markAsTouched();
    if (!this.nicknameForm().valid()) return;

    const next = this.draft().nickname.trim();
    if (next === user.nickname) return;

    try {
      await this.userService.changeNickname(next);
    } catch (error) {
      this.draft.set({ nickname: user.nickname });
      toast.error(problemDetail(error, '별명을 바꾸지 못했습니다.'));
      return;
    }
  }

  protected commitNicknameOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    void this.commitNickname();
  }

  /** 현재 비밀번호를 다시 받는다. 로그인 상태만으로 바꾸게 하면 자리를 비운 사이 남이 갈 수 있다. */
  protected async commitPassword(): Promise<void> {
    this.passwordForm().markAsTouched();
    if (!this.passwordForm().valid()) return;

    const { currentPassword, newPassword } = this.passwordDraft();
    this.changingPassword.set(true);
    try {
      await this.authService.changePassword(currentPassword, newPassword);
    } catch (error) {
      toast.error(problemDetail(error, '비밀번호를 바꾸지 못했습니다.'));
      return;
    } finally {
      this.changingPassword.set(false);
    }
    this.passwordDraft.set({ currentPassword: '', newPassword: '' });
    this.passwordForm().reset();
    toast.success('비밀번호를 바꿨습니다. 다른 기기의 로그인은 끊겼습니다.');
  }

  protected uploadImage(): void {
    openUppyDialog({
      maxNumberOfFiles: 1,
      maxFileSize: MAX_IMAGE_BYTES,
      allowedFileTypes: ['image/*'],
      note: '이미지 1개, 1MB 이하',
      presign: (file) => this.presign('USER_PROFILE_IMAGE', file.name, file.type, file.size),
      attach: ([upload]) => this.userService.confirmProfileImage(upload.objectKey),
      onAttachError: (message) => toast.error(message),
    });
  }

  protected async clearImage(): Promise<void> {
    try {
      await this.userService.clearProfileImage();
    } catch (error) {
      toast.error(problemDetail(error, '이미지를 지우지 못했습니다.'));
      return;
    }
  }

  protected async enablePush(): Promise<void> {
    try {
      await this.pushService.enable();
    } catch (error) {
      toast.error(problemDetail(error, '알림을 켜지 못했습니다.'));
    }
  }

  protected async disablePush(): Promise<void> {
    try {
      await this.pushService.disable();
    } catch (error) {
      toast.error(problemDetail(error, '알림을 끄지 못했습니다.'));
    }
  }

  protected async issueToken(): Promise<void> {
    try {
      const issued = await this.userService.issueApiToken();
      this.issuedToken.set(issued.token);
    } catch (error) {
      toast.error(problemDetail(error, '토큰을 발급하지 못했습니다.'));
      return;
    }
  }

  protected async deleteToken(): Promise<void> {
    try {
      await this.userService.deleteApiToken();
    } catch (error) {
      toast.error(problemDetail(error, '토큰을 지우지 못했습니다.'));
      return;
    }
    this.issuedToken.set(null);
  }

  protected async copyToken(): Promise<void> {
    const token = this.issuedToken();
    if (!token) return;
    await navigator.clipboard.writeText(token);
    toast.success('토큰을 복사했습니다.');
  }

  protected async copyCommand(command: string): Promise<void> {
    await navigator.clipboard.writeText(command);
    toast.success('명령을 복사했습니다.');
  }

  protected async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch {
      toast.error('로그아웃하지 못했습니다.');
      return;
    }
    this.userService.reload();
    await this.router.navigateByUrl(ROUTES.login());
  }
}
