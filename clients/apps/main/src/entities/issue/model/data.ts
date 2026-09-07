export type ItemKind = 'EPIC' | 'STORY' | 'TASK' | 'BUG';

export type ItemState = '백로그' | '예정' | '진행 중' | '완료' | '취소';

export const ITEM_STATES: ItemState[] = ['백로그', '예정', '진행 중', '완료', '취소'];

export interface Criterion {
  readonly n: number;
  readonly text: string;
  done: boolean;
}

export interface WorkItem {
  readonly id: string;
  readonly kind: ItemKind;
  title: string;
  body: string;
  state: ItemState;
  /** 계층은 식별자가 아니라 이 필드로 관리한다. 부모를 바꿔도 식별자는 유지된다. */
  parentId?: string;
  assignee?: string;
  criteria: Criterion[];
  /** 근거가 되는 문서. 문서 화면에서 역방향으로도 조회한다. */
  docIds: string[];
}

export const INITIAL_ITEMS: WorkItem[] = [];
