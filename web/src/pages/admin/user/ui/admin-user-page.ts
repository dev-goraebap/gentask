import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AdminUserService } from '../api/admin-user-service';
import { UserAvatar } from '@/entities/user';
import { HlmButton } from '@/shared/ui/button';
import { HlmInput } from '@/shared/ui/input';
import { Veil } from '@/shared/ui/veil';

/** 한 쪽에 보여 줄 수. 서비스가 요청에 싣는 값과 같아야 쪽 수가 맞는다. */
const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-user',
  imports: [HlmButton, HlmInput, UserAvatar, Veil],
  host: {
    class: 'flex min-h-0 flex-1 flex-col',
    '[attr.aria-busy]': 'veilLoading() || null',
  },
  providers: [AdminUserService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-user-page.html',
})
export class AdminUserPage {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly adminUserService = inject(AdminUserService);

  // --- 상태 --------------------------------------------------------------------------------------
  protected readonly draftKeyword = signal('');

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly users = this.adminUserService.value;
  protected readonly page = this.adminUserService.page;

  protected readonly veilLoading = computed(() => this.adminUserService.status() === 'loading');
  protected readonly veilFailed = computed(() => this.adminUserService.status() === 'error');

  protected readonly pageCount = computed(() =>
    Math.max(Math.ceil((this.users()?.total ?? 0) / PAGE_SIZE), 1),
  );

  // --- 동작 --------------------------------------------------------------------------------------
  protected search(): void {
    this.adminUserService.search(this.draftKeyword());
  }

  protected searchOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    this.search();
  }

  protected movePage(delta: number): void {
    this.page.update((current) => Math.min(Math.max(current + delta, 0), this.pageCount() - 1));
  }

  /** 쪽을 넘겨도 이어지는 번호. 줄의 자리가 아니라 목록에서의 순서를 가리킨다. */
  protected ordinal(index: number): number {
    return this.page() * PAGE_SIZE + index + 1;
  }

  protected formatAt(at: string): string {
    return new Date(at).toLocaleString('ko-KR');
  }
}
