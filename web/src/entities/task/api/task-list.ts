import { isPlatformServer } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ENDPOINTS } from '@/shared/api';
import type { Task } from '../model/task';

@Injectable()
export class TaskList {
  private readonly server = isPlatformServer(inject(PLATFORM_ID));

  private readonly resource = httpResource<readonly Task[]>(() =>
    this.server ? undefined : ENDPOINTS.tasks,
  );

  readonly tasks = computed<readonly Task[]>(() =>
    this.resource.hasValue() ? this.resource.value() : [],
  );

  readonly status = this.resource.status;

  reload(): void {
    this.resource.reload();
  }
}
