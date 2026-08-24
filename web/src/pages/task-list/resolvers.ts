import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { TASK_STORE } from '@/entities/task';

/**
 * 화면 진입 전에 목록을 받습니다. 그동안 셸의 베일이 콘텐츠 영역을 덮습니다.
 * 09-state.md 3.1절 · 10-loading.md 5절.
 *
 * 배럴이 아니라 이 진입점에서 가져갑니다. 같은 배럴을 즉시 임포트와 지연 임포트가 함께
 * 쓰면 지연 청크가 재수출 껍데기만 남고 화면 코드가 초기 번들에 들어갑니다.
 * 01-dev-environment.md 7절.
 *
 * 서버에서는 건너뜁니다. 작업 화면은 Client 렌더이고(05-rendering.md 1절) 정적 생성은
 * 백엔드 없이 도는 빌드 단계라, 여기서 부르면 프리렌더가 응답을 기다리다 끊깁니다.
 */
export const taskListResolver: ResolveFn<void> = async () => {
  if (isPlatformServer(inject(PLATFORM_ID))) return;
  await inject(TASK_STORE).load();
};
