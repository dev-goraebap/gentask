import { InjectionToken, type Signal } from '@angular/core';
import type { Task } from '../model/task';

/**
 * 화면이 할일 데이터에 접근하는 유일한 통로입니다.
 *
 * UI 는 이 인터페이스 뒤에서만 데이터에 접근하며 컴포넌트에 목데이터를 직접 박지 않습니다.
 * 프로토타입 구간에는 Mock 구현이, 백엔드가 붙으면 Http 구현이 이 자리에 들어가고
 * 교체는 프로바이더 하나를 바꾸는 일로 축소됩니다.
 * 근거는 docs/architecture/references/09-state.md 2절입니다.
 *
 * 변경 메서드가 Promise 를 반환하는 이유는 Http 구현에서 실패와 대기가 생기기 때문입니다.
 * Mock 이 동기라고 해서 동기 시그니처로 두면 교체 시점에 호출부를 전부 고쳐야 합니다.
 */
export interface TaskStore {
  /** 화면이 읽는 사본입니다. 이 신호를 직접 수정하지 않고 아래 명령으로 변경합니다. */
  readonly tasks: Signal<readonly Task[]>;

  add(title: string): Promise<void>;

  setCompleted(id: string, completed: boolean): Promise<void>;
}

/**
 * 구현을 상위 계층이 제공합니다. 화면 범위 서비스이므로 라우트 정의의 providers 에
 * 등록하며 providedIn: 'root' 를 쓰지 않습니다. 02-package-structure.md 7.5절.
 */
export const TASK_STORE = new InjectionToken<TaskStore>('TaskStore');
