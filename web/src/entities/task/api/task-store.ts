import { InjectionToken, type Signal } from '@angular/core';
import type { Task } from '../model/task';

/**
 * 화면이 작업 데이터에 접근하는 유일한 통로입니다.
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

  /**
   * 제목만으로 만듭니다. `seed` 는 적는 자리가 놓인 관점이 부여하는 성질입니다.
   *
   * 관점 안에서 적은 항목이 그 관점에 나타나지 않으면 적은 사람은 사라진 것으로 봅니다.
   * 그래서 화면이 관점의 조건을 씨앗으로 넘기고 저장소는 그것을 그대로 담습니다.
   */
  add(title: string, seed?: TaskSeed): Promise<void>;

  setCompleted(id: string, completed: boolean): Promise<void>;

  /** 중요 표시를 켜고 끕니다. TK-003 A4. */
  setImportant(id: string, important: boolean): Promise<void>;

  /**
   * 나의 하루에 담고 뺍니다. 담는 날짜는 저장소가 정합니다.
   *
   * 화면이 오늘 날짜를 넘기지 않는 이유는 그 값이 저장 형식의 일부이기 때문입니다.
   * 화면마다 오늘을 계산하면 자정을 넘긴 화면과 그렇지 않은 화면이 다른 날짜를 씁니다.
   */
  setMyDay(id: string, inMyDay: boolean): Promise<void>;

  /**
   * 편집 가능한 필드만 받습니다. 완료 여부는 setCompleted 가 소유하며, 목록의 체크와
   * 상세의 저장이 같은 값을 서로 다른 경로로 바꾸면 어느 쪽이 이겼는지 알 수 없게 됩니다.
   */
  update(id: string, patch: TaskDraft): Promise<void>;

  /**
   * 지운 항목을 되살리는 명령은 두지 않습니다. 삭제 전 확인이 안전장치이며, 영구적인
   * 복구가 필요한지는 TK-003 의 미결 `삭제 복구` 가 정합니다.
   */
  remove(id: string): Promise<void>;
}

/**
 * 사용자가 상세 화면에서 고칠 수 있는 부분입니다.
 *
 * 필드에 readonly 를 붙이지 않는 이유는 이 타입이 폼의 모델이기도 하기 때문입니다.
 * Signal Forms 는 읽기 전용 속성에 경로를 만들지 못합니다. 저장된 값의 불변성은
 * Task 가 지키며 이 타입은 편집 중인 사본입니다.
 */
/**
 * 새 항목이 태어날 때 함께 받는 성질입니다. 적는 자리가 놓인 관점이 정합니다.
 *
 * 전체 관점에서는 비어 있습니다. 그 자리에는 부여할 성질이 없습니다.
 */
export type TaskSeed = {
  readonly important?: boolean;
  readonly inMyDay?: boolean;
  readonly dueDate?: string | null;

  /** 적는 자리에서 붙인 미리 알림입니다. TK-001 A3. 형식은 Task 와 같습니다. */
  readonly remindAt?: string | null;
};

export type TaskDraft = {
  title: string;
  note: string;

  /** 정하지 않은 상태를 담아야 하므로 null 을 허용합니다. 형식은 Task 와 같습니다. */
  dueDate: string | null;

  /** 미리 알림입니다. TK-003 A10. 기한과 서로를 정하지 않으므로 따로 담습니다. */
  remindAt: string | null;
};

/**
 * 구현을 상위 계층이 제공합니다. 화면 범위 서비스이므로 라우트 정의의 providers 에
 * 등록하며 providedIn: 'root' 를 쓰지 않습니다. 02-package-structure.md 7.5절.
 */
export const TASK_STORE = new InjectionToken<TaskStore>('TaskStore');
