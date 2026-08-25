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
import { AuthService, UserAvatar, UserService } from '@/entities/user';
import { problemDetail } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { openUppyDialog } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@/shared/ui/field';
import { HlmInput } from '@/shared/ui/input';
import { toast } from '@/shared/ui/sonner';
import { Veil } from '@/shared/ui/veil';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account.page.html',
})
export class AccountPage {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // --- 상태 --------------------------------------------------------------------------------------
  protected readonly issuedToken = signal<string | null>(null);
  private readonly draft = signal({ nickname: '' });

  protected readonly nicknameForm = form(this.draft, (path) => {
    validate(path.nickname, ({ value }) =>
      value().trim() ? undefined : requiredError({ message: '별명을 입력해 주세요' }),
    );
  });

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

  protected uploadImage(): void {
    openUppyDialog({
      maxNumberOfFiles: 1,
      maxFileSize: MAX_IMAGE_BYTES,
      allowedFileTypes: ['image/*'],
      note: '이미지 1개, 10MB 이하',
      presign: (file) => this.userService.presignProfileImage(file.name, file.type, file.size),
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
