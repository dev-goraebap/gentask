import { isPlatformServer } from '@angular/common';
import { httpResource, type HttpResourceRef } from '@angular/common/http';
import { inject, PLATFORM_ID, type Signal } from '@angular/core';
import { ENDPOINTS, type TaskFileView } from '@/shared/api';

/**
 * 열린 작업의 파일 목록 (TK-003 A11). 상세 패널이 열릴 때만 필요한 보조 조회라
 * 라우트 스코프가 아니라 패널이 듭니다. 09-state.md 3.1절.
 *
 * 대상이 바뀌면 요청도 따라 바뀌고, 없으면(패널이 대상을 잃으면) 요청하지 않습니다.
 */
export function injectTaskFiles(taskId: Signal<string | undefined>): HttpResourceRef<TaskFileView[] | undefined> {
  const server = isPlatformServer(inject(PLATFORM_ID));
  return httpResource<TaskFileView[]>(() => {
    if (server) return undefined;
    const id = taskId();
    return id ? ENDPOINTS.taskFiles(id) : undefined;
  });
}
