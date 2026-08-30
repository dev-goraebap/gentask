import { isPlatformServer } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { ENDPOINTS, type AdminUserPageView } from '@/shared/api';

/** 한 쪽에 보여 줄 수. 서버가 죄는 상한(100)보다 작게 둔다. */
const PAGE_SIZE = 20;

@Injectable()
export class AdminUserService {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  // --- 상태 --------------------------------------------------------------------------------------
  readonly keyword = signal('');
  readonly page = signal(0);

  // --- 파생 --------------------------------------------------------------------------------------
  private readonly resource = httpResource<AdminUserPageView>(() =>
    this.isServer
      ? undefined
      : {
          url: ENDPOINTS.adminUsers,
          params: { keyword: this.keyword(), page: this.page(), size: PAGE_SIZE },
        },
  );

  readonly value = computed(() => this.resource.value());
  readonly status = this.resource.status;

  // --- 동작 --------------------------------------------------------------------------------------
  search(keyword: string): void {
    this.page.set(0);
    this.keyword.set(keyword.trim());
  }
}
