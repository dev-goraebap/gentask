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

  /**
   * 편집 가능한 필드만 받습니다. 완료 여부는 setCompleted 가 소유하며, 목록의 체크와
   * 상세의 저장이 같은 값을 서로 다른 경로로 바꾸면 어느 쪽이 이겼는지 알 수 없게 됩니다.
   */
  update(id: string, patch: TaskDraft): Promise<void>;

  remove(id: string): Promise<void>;

  /**
   * 지운 항목을 같은 식별자로 되살립니다. 목록의 자리는 `createdAt` 과 `completedAt` 이
   * 정하므로 순서를 따로 넘기지 않습니다.
   *
   * 되살릴 값을 저장소가 보관하지 않는 이유는 그 보관 기간이 되돌리기 안내의 수명과
   * 같아야 하는데, 그 수명을 아는 것은 화면이기 때문입니다. 저장소가 들고 있으면
   * 화면이 안내를 거두는 시점과 저장소가 값을 버리는 시점이 따로 놀게 됩니다.
   */
  restore(task: Task): Promise<void>;
}

/**
 * 사용자가 상세 화면에서 고칠 수 있는 부분입니다.
 *
 * 필드에 readonly 를 붙이지 않는 이유는 이 타입이 폼의 모델이기도 하기 때문입니다.
 * Signal Forms 는 읽기 전용 속성에 경로를 만들지 못합니다. 저장된 값의 불변성은
 * Task 가 지키며 이 타입은 편집 중인 사본입니다.
 */
export type TaskDraft = {
  title: string;
  note: string;

  /** 정하지 않은 상태를 담아야 하므로 null 을 허용합니다. 형식은 Task 와 같습니다. */
  dueDate: string | null;
};

/**
 * 구현을 상위 계층이 제공합니다. 화면 범위 서비스이므로 라우트 정의의 providers 에
 * 등록하며 providedIn: 'root' 를 쓰지 않습니다. 02-package-structure.md 7.5절.
 */
export const TASK_STORE = new InjectionToken<TaskStore>('TaskStore');
