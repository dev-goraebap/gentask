import type { Provider } from '@angular/core';
import { HttpTaskStore } from './http-task-store';
import { TASK_STORE } from './task-store';

/**
 * 작업 데이터의 프로바이더입니다. 라우트 정의의 providers 에 등록합니다.
 *
 * providedIn: 'root' 를 쓰지 않는 이유는 서비스 수명이 화면 수명과 어긋나 화면을 떠나도
 * 상태가 남기 때문입니다. 02-package-structure.md 7.5절.
 *
 * 목록과 상세가 한 인스턴스를 공유해야 하므로 두 화면을 감싸는 라우트에 등록합니다.
 * 화면마다 따로 두면 목록에서 고친 것이 상세에 보이지 않습니다.
 *
 * MockTaskStore 는 지우지 않습니다. 테스트와 오프라인 개발이 계속 쓰며, 두 구현이 같은
 * 인터페이스를 지키는지가 계약 유지의 확인 수단입니다. 14-api-contract.md 4절.
 */
export function provideTask(): Provider[] {
  return [HttpTaskStore, { provide: TASK_STORE, useExisting: HttpTaskStore }];
}
