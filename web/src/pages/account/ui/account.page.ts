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
import { AuthCommands, CurrentUser, MeCommands, UserAvatar } from '@/entities/user';
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
  template: `
    <app-veil [loading]="veilLoading()" [failed]="veilFailed()" />

    <section
      class="mx-auto flex w-full max-w-[40rem] flex-1 flex-col gap-6 px-4 pt-8 pb-8 md:pt-12"
    >
      <h1 class="text-2xl font-semibold tracking-tight">계정</h1>

      @if (me(); as user) {
        <div class="border-border bg-card border p-4">
          <div class="flex items-center gap-4">
            <app-user-avatar
              class="size-16 text-xl"
              [name]="user.nickname"
              [imageUrl]="user.profileImageUrl"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">{{ user.nickname }}</p>
              <p class="text-foreground-secondary truncate text-sm">{{ user.email }}</p>
              <p class="text-foreground-secondary text-xs">{{ joinedAt() }} 가입</p>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <button hlmBtn type="button" variant="outline" size="sm" (click)="uploadImage()">
              이미지 올리기
            </button>
            @if (user.profileImageUrl) {
              <button hlmBtn type="button" variant="ghost" size="sm" (click)="clearImage()">
                이미지 지우기
              </button>
            }
          </div>

          <form
            novalidate
            [formRoot]="nicknameForm"
            (submit)="$event.preventDefault()"
            class="mt-4"
          >
            <div hlmField>
              <label hlmFieldLabel for="account-nickname">별명</label>
              <input
                hlmInput
                id="account-nickname"
                autocomplete="nickname"
                [formField]="nicknameForm.nickname"
                (blur)="commitNickname()"
                (keydown)="commitNicknameOnEnter($event)"
              />
              @if (nicknameForm.nickname().touched()) {
                @for (error of nicknameForm.nickname().errors(); track error.kind) {
                  <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
                }
              }
            </div>
          </form>
        </div>

        <div class="border-border bg-card border p-4">
          <h2 class="font-medium">에이전트 토큰</h2>
          <p class="text-foreground-secondary mt-1 text-sm">
            로컬 에이전트(MCP)가 내 계정으로 작업을 다룰 때 쓰는 토큰입니다. 요청의
            <code class="text-xs">Authorization: Bearer</code> 헤더에 넣습니다.
          </p>

          @if (issuedToken(); as token) {
            <div class="border-border bg-muted mt-3 flex items-center gap-2 border p-2">
              <code class="min-w-0 flex-1 truncate text-xs">{{ token }}</code>
              <button hlmBtn type="button" variant="outline" size="sm" (click)="copyToken()">
                복사
              </button>
            </div>
            <p class="text-warning mt-2 text-xs">
              이 화면을 떠나면 다시 볼 수 없습니다. 지금 복사해 두세요.
            </p>
          } @else if (user.apiTokenIssuedAt) {
            <p class="text-foreground-secondary mt-3 text-sm">
              {{ tokenIssuedAt() }} 에 발급된 토큰이 있습니다. 원문은 발급할 때만 보입니다.
            </p>
          } @else {
            <p class="text-foreground-secondary mt-3 text-sm">아직 발급한 토큰이 없습니다.</p>
          }

          <div class="mt-3 flex flex-wrap gap-2">
            <button hlmBtn type="button" variant="outline" size="sm" (click)="issueToken()">
              {{ user.apiTokenIssuedAt ? '다시 발급' : '발급' }}
            </button>
            @if (user.apiTokenIssuedAt) {
              <button hlmBtn type="button" variant="ghost" size="sm" (click)="deleteToken()">
                지우기
              </button>
            }
          </div>
        </div>

        <div>
          <button hlmBtn type="button" variant="outline" (click)="logout()">로그아웃</button>
        </div>
      }
    </section>
  `,
})
export class AccountPage {
  private readonly currentUser = inject(CurrentUser);
  private readonly meCommands = inject(MeCommands);
  private readonly auth = inject(AuthCommands);
  private readonly router = inject(Router);

  protected readonly me = this.currentUser.me;

  protected readonly veilLoading = computed(() => this.currentUser.status() === 'loading');
  protected readonly veilFailed = computed(() => this.currentUser.status() === 'error');

  protected readonly issuedToken = signal<string | null>(null);

  private readonly draft = signal({ nickname: '' });

  protected readonly nicknameForm = form(this.draft, (path) => {
    validate(path.nickname, ({ value }) =>
      value().trim() ? undefined : requiredError({ message: '별명을 입력해 주세요' }),
    );
  });

  private readonly loaded = signal<string | null>(null);

  constructor() {
    effect(() => {
      const user = this.me();
      if (!user || untracked(this.loaded) === user.id) return;
      this.loaded.set(user.id);
      this.draft.set({ nickname: user.nickname });
    });
  }

  protected readonly joinedAt = computed(() => {
    const user = this.me();
    return user ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '';
  });

  protected readonly tokenIssuedAt = computed(() => {
    const at = this.me()?.apiTokenIssuedAt;
    return at ? new Date(at).toLocaleString('ko-KR') : '';
  });

  protected async commitNickname(): Promise<void> {
    const user = this.me();
    if (!user) return;

    this.nicknameForm().markAsTouched();
    if (!this.nicknameForm().valid()) return;

    const next = this.draft().nickname.trim();
    if (next === user.nickname) return;

    try {
      await this.meCommands.changeNickname(next);
    } catch (error) {
      this.draft.set({ nickname: user.nickname });
      toast.error(problemDetail(error, '별명을 바꾸지 못했습니다.'));
      return;
    }
    this.currentUser.reload();
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
      presign: (file) => this.meCommands.presignProfileImage(file.name, file.type, file.size),
      attach: (objectKey) => this.meCommands.confirmProfileImage(objectKey),
      onCompleted: () => this.currentUser.reload(),
      onAttachError: (message) => toast.error(message),
    });
  }

  protected async clearImage(): Promise<void> {
    try {
      await this.meCommands.clearProfileImage();
    } catch (error) {
      toast.error(problemDetail(error, '이미지를 지우지 못했습니다.'));
      return;
    }
    this.currentUser.reload();
  }

  protected async issueToken(): Promise<void> {
    try {
      const issued = await this.meCommands.issueApiToken();
      this.issuedToken.set(issued.token);
    } catch (error) {
      toast.error(problemDetail(error, '토큰을 발급하지 못했습니다.'));
      return;
    }
    this.currentUser.reload();
  }

  protected async deleteToken(): Promise<void> {
    try {
      await this.meCommands.deleteApiToken();
    } catch (error) {
      toast.error(problemDetail(error, '토큰을 지우지 못했습니다.'));
      return;
    }
    this.issuedToken.set(null);
    this.currentUser.reload();
  }

  protected async copyToken(): Promise<void> {
    const token = this.issuedToken();
    if (!token) return;
    await navigator.clipboard.writeText(token);
    toast.success('토큰을 복사했습니다.');
  }

  protected async logout(): Promise<void> {
    try {
      await this.auth.logout();
    } catch {
      toast.error('로그아웃하지 못했습니다.');
      return;
    }
    this.currentUser.reload();
    await this.router.navigateByUrl(ROUTES.login());
  }
}
