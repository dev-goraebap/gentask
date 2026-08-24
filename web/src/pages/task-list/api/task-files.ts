import { isPlatformServer } from '@angular/common';
import { httpResource, type HttpResourceRef } from '@angular/common/http';
import { inject, PLATFORM_ID, type Signal } from '@angular/core';
import { ENDPOINTS, type TaskFileView } from '@/shared/api';

export function injectTaskFiles(
  taskId: Signal<string | undefined>,
): HttpResourceRef<TaskFileView[] | undefined> {
  const server = isPlatformServer(inject(PLATFORM_ID));
  return httpResource<TaskFileView[]>(() => {
    if (server) return undefined;
    const id = taskId();
    return id ? ENDPOINTS.taskFiles(id) : undefined;
  });
}
