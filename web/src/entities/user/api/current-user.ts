import { isPlatformServer } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ENDPOINTS, type MeView } from '@/shared/api';

@Injectable()
export class CurrentUser {
  private readonly server = isPlatformServer(inject(PLATFORM_ID));

  private readonly resource = httpResource<MeView>(() => (this.server ? undefined : ENDPOINTS.me));

  readonly me = computed<MeView | undefined>(() =>
    this.resource.hasValue() ? this.resource.value() : undefined,
  );

  readonly status = this.resource.status;

  reload(): void {
    this.resource.reload();
  }
}
