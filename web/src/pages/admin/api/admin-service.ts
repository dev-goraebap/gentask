import { isPlatformServer } from '@angular/common';
import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ENDPOINTS,
  type AdminUserPageView,
  type PushFailurePageView,
  type UserRole,
} from '@/shared/api';

/** 한 쪽에 보여 줄 수. 서버가 죄는 상한(100)보다 작게 둔다. */
const PAGE_SIZE = 20;

@Injectable()
export class AdminService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly httpClient = inject(HttpClient);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  // --- 상태 --------------------------------------------------------------------------------------
  readonly keyword = signal('');
  readonly userPage = signal(0);
  readonly failurePage = signal(0);
  readonly includeResolved = signal(false);

  // --- 파생 --------------------------------------------------------------------------------------
  private readonly usersResource = httpResource<AdminUserPageView>(() =>
    this.isServer
      ? undefined
      : {
          url: ENDPOINTS.adminUsers,
          params: { keyword: this.keyword(), page: this.userPage(), size: PAGE_SIZE },
        },
  );

  private readonly failuresResource = httpResource<PushFailurePageView>(() =>
    this.isServer
      ? undefined
      : {
          url: ENDPOINTS.adminPushFailures,
          params: {
            includeResolved: this.includeResolved(),
            page: this.failurePage(),
            size: PAGE_SIZE,
          },
        },
  );

  readonly users = computed(() => this.usersResource.value());
  readonly usersStatus = this.usersResource.status;

  readonly failures = computed(() => this.failuresResource.value());
  readonly failuresStatus = this.failuresResource.status;

  readonly pageSize = PAGE_SIZE;

  // --- 동작 --------------------------------------------------------------------------------------
  async changeRole(userId: string, role: UserRole): Promise<void> {
    await firstValueFrom(this.httpClient.patch<void>(ENDPOINTS.adminUserRole(userId), { role }));
    this.usersResource.reload();
  }

  /** 확인했다고 표시한다. 자리는 그대로 두므로 다음 회차에 다시 시도한다. */
  async resolveFailure(failureId: string): Promise<void> {
    await firstValueFrom(
      this.httpClient.post<void>(ENDPOINTS.adminPushFailureResolve(failureId), {}),
    );
    this.failuresResource.reload();
  }

  /** 그 자리를 거둔다. 사용자가 다시 켜면 새 자리가 선다. */
  async revokeFailure(failureId: string): Promise<void> {
    await firstValueFrom(
      this.httpClient.post<void>(ENDPOINTS.adminPushFailureRevoke(failureId), {}),
    );
    this.failuresResource.reload();
  }
}
