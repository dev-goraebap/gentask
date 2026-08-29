import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AdminService } from '../api/admin-service';
import { UserService } from '@/entities/user';
import { problemDetail, type AdminUserView, type PushFailureView } from '@/shared/api';
import { HlmButton } from '@/shared/ui/button';
import { HlmInput } from '@/shared/ui/input';
import { toast } from '@/shared/ui/sonner';
import { Veil } from '@/shared/ui/veil';

/** 관리 화면이 보여 주는 두 자리. */
type Tab = 'users' | 'failures';

@Component({
  selector: 'app-admin',
  imports: [HlmButton, HlmInput, Veil],
  host: {
    class: 'flex min-h-0 flex-1 flex-col',
    '[attr.aria-busy]': 'veilLoading() || null',
  },
  providers: [AdminService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-page.html',
})
export class AdminPage {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly adminService = inject(AdminService);
  private readonly userService = inject(UserService);

  // --- 상태 --------------------------------------------------------------------------------------
  protected readonly tab = signal<Tab>('users');
  protected readonly draftKeyword = signal('');

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly users = this.adminService.users;
  protected readonly failures = this.adminService.failures;
  protected readonly keyword = this.adminService.keyword;
  protected readonly includeResolved = this.adminService.includeResolved;

  protected readonly veilLoading = computed(() =>
    this.tab() === 'users'
      ? this.adminService.usersStatus() === 'loading'
      : this.adminService.failuresStatus() === 'loading',
  );

  protected readonly veilFailed = computed(() =>
    this.tab() === 'users'
      ? this.adminService.usersStatus() === 'error'
      : this.adminService.failuresStatus() === 'error',
  );

  /** 지금 보고 있는 사람. 자기 자신의 권한은 바꿀 수 없으므로 그 줄의 단추를 내린다. */
  protected readonly myId = computed(() => this.userService.me()?.id);

  protected readonly userPage = this.adminService.userPage;
  protected readonly failurePage = this.adminService.failurePage;

  protected readonly userPageCount = computed(() => pageCount(this.users()?.total));
  protected readonly failurePageCount = computed(() => pageCount(this.failures()?.total));

  // --- 동작 --------------------------------------------------------------------------------------
  protected show(tab: Tab): void {
    this.tab.set(tab);
  }

  protected search(): void {
    this.adminService.userPage.set(0);
    this.adminService.keyword.set(this.draftKeyword().trim());
  }

  protected searchOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    this.search();
  }

  protected async promote(user: AdminUserView): Promise<void> {
    await this.changeRole(user, 'ADMIN');
  }

  protected async demote(user: AdminUserView): Promise<void> {
    await this.changeRole(user, 'USER');
  }

  protected async resolve(failure: PushFailureView): Promise<void> {
    try {
      await this.adminService.resolveFailure(failure.id);
    } catch (error) {
      toast.error(problemDetail(error, '처리로 표시하지 못했습니다.'));
    }
  }

  protected async revoke(failure: PushFailureView): Promise<void> {
    try {
      await this.adminService.revokeFailure(failure.id);
    } catch (error) {
      toast.error(problemDetail(error, '자리를 거두지 못했습니다.'));
    }
  }

  protected toggleResolved(): void {
    this.adminService.failurePage.set(0);
    this.adminService.includeResolved.update((current) => !current);
  }

  protected movePage(delta: number): void {
    const target = this.tab() === 'users' ? this.adminService.userPage : this.adminService.failurePage;
    const last = (this.tab() === 'users' ? this.userPageCount() : this.failurePageCount()) - 1;
    target.update((current) => Math.min(Math.max(current + delta, 0), Math.max(last, 0)));
  }

  protected formatAt(at: string | null): string {
    return at ? new Date(at).toLocaleString('ko-KR') : '';
  }

  /** endpoint 는 길어 줄을 넘긴다. 어느 자리인지 가릴 만큼만 보여 준다. */
  protected shorten(endpoint: string): string {
    return endpoint.length <= 48 ? endpoint : `${endpoint.slice(0, 24)}…${endpoint.slice(-16)}`;
  }

  private async changeRole(user: AdminUserView, role: 'USER' | 'ADMIN'): Promise<void> {
    try {
      await this.adminService.changeRole(user.id, role);
    } catch (error) {
      toast.error(problemDetail(error, '권한을 바꾸지 못했습니다.'));
    }
  }
}

function pageCount(total: number | undefined): number {
  return Math.max(Math.ceil((total ?? 0) / 20), 1);
}
