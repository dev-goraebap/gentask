import { isPlatformServer } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENDPOINTS, type PushFailurePageView } from '@/shared/api';

/** 한 쪽에 보여 줄 수. 서버가 죄는 상한(100)보다 작게 둔다. */
const PAGE_SIZE = 20;

@Injectable()
export class AdminNotificationService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly httpClient = inject(HttpClient);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  // --- 상태 --------------------------------------------------------------------------------------
  readonly page = signal(0);
  readonly includeResolved = signal(false);

  // --- 파생 --------------------------------------------------------------------------------------
  private readonly resource = httpResource<PushFailurePageView>(() =>
    this.isServer
      ? undefined
      : {
          url: ENDPOINTS.adminPushFailures,
          params: {
            includeResolved: this.includeResolved(),
            page: this.page(),
            size: PAGE_SIZE,
          },
        },
  );

  readonly value = computed(() => this.resource.value());
  readonly status = this.resource.status;

  // --- 동작 --------------------------------------------------------------------------------------

  /** 확인했다고 표시한다. 자리는 그대로 두므로 다음 회차에 다시 시도한다. */
  async resolve(failureId: string): Promise<void> {
    await firstValueFrom(
      this.httpClient.post<void>(ENDPOINTS.adminPushFailureResolve(failureId), {}),
    );
    this.resource.reload();
  }

  /** 그 자리를 거둔다. 사용자가 다시 켜면 새 자리가 선다. */
  async revoke(failureId: string): Promise<void> {
    await firstValueFrom(
      this.httpClient.post<void>(ENDPOINTS.adminPushFailureRevoke(failureId), {}),
    );
    this.resource.reload();
  }

  toggleResolved(): void {
    this.page.set(0);
    this.includeResolved.update((current) => !current);
  }
}
