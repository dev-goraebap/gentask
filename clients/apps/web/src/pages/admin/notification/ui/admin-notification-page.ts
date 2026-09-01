import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AdminNotificationService } from '../api/admin-notification-service';
import { problemDetail, type PushFailureView } from '@/shared/api';
import { HlmButton } from '@/shared/ui/button';
import { toast } from '@/shared/ui/sonner';
import { EmptyState } from '@/shared/ui/empty-state';
import { Veil } from '@/shared/ui/veil';
import { AppPageBack } from '@/shared/ui/page-back';
import { ROUTES } from '@/shared/config';

/** 한 쪽에 보여 줄 수. 서비스가 요청에 싣는 값과 같아야 쪽 수가 맞는다. */
const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-notification',
  imports: [AppPageBack, EmptyState, HlmButton, Veil],
  host: {
    class: 'flex min-h-0 flex-1 flex-col',
    '[attr.aria-busy]': 'veilLoading() || null',
  },
  providers: [AdminNotificationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-notification-page.html',
})
export class AdminNotificationPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly service = inject(AdminNotificationService);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly failures = this.service.value;
  protected readonly page = this.service.page;
  protected readonly includeResolved = this.service.includeResolved;

  protected readonly veilLoading = computed(() => this.service.status() === 'loading');
  protected readonly veilFailed = computed(() => this.service.status() === 'error');

  protected readonly pageCount = computed(() =>
    Math.max(Math.ceil((this.failures()?.total ?? 0) / PAGE_SIZE), 1),
  );

  // --- 동작 --------------------------------------------------------------------------------------
  protected async resolve(failure: PushFailureView): Promise<void> {
    try {
      await this.service.resolve(failure.id);
    } catch (error) {
      toast.error(problemDetail(error, '처리로 표시하지 못했습니다.'));
    }
  }

  protected async revoke(failure: PushFailureView): Promise<void> {
    try {
      await this.service.revoke(failure.id);
    } catch (error) {
      toast.error(problemDetail(error, '자리를 거두지 못했습니다.'));
    }
  }

  protected toggleResolved(): void {
    this.service.toggleResolved();
  }

  protected movePage(delta: number): void {
    this.page.update((current) => Math.min(Math.max(current + delta, 0), this.pageCount() - 1));
  }

  protected formatAt(at: string): string {
    return new Date(at).toLocaleString('ko-KR');
  }

}
