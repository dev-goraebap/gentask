import type { Provider } from '@angular/core';
import { MockTaskStore } from './mock-task-store';
import { TASK_STORE } from './task-store';

/**
 * 할일 데이터의 프로바이더입니다. 라우트 정의의 providers 에 등록합니다.
 *
 * providedIn: 'root' 를 쓰지 않는 이유는 서비스 수명이 화면 수명과 어긋나 화면을 떠나도
 * 상태가 남기 때문입니다. 02-package-structure.md 7.5절.
 *
 * 목록과 상세가 한 인스턴스를 공유해야 하므로 두 화면을 감싸는 라우트에 등록합니다.
 * 화면마다 따로 두면 목록에서 고친 것이 상세에 보이지 않습니다.
 *
 * 백엔드가 붙으면 이 배열의 useExisting 만 Http 구현으로 바꿉니다. 호출부는 바뀌지 않습니다.
 */
export function provideTask(): Provider[] {
  return [MockTaskStore, { provide: TASK_STORE, useExisting: MockTaskStore }];
}
