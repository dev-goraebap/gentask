import { type Criterion, type ItemKind, type ItemState, type WorkItem } from '../model/data';

export const STATE_VARIANT: Record<ItemState, 'success' | 'warning' | 'error' | 'accent' | 'neutral'> = {
  백로그: 'neutral',
  예정: 'accent',
  '진행 중': 'warning',
  완료: 'success',
  취소: 'error',
};

export const KIND_COLOR: Record<ItemKind, 'purple' | 'blue' | 'teal' | 'red'> = {
  EPIC: 'purple',
  STORY: 'blue',
  TASK: 'teal',
  BUG: 'red',
};

export const KIND_LABEL: Record<ItemKind, string> = {
  EPIC: '에픽',
  STORY: '스토리',
  TASK: '태스크',
  BUG: '버그',
};

export function doneCount(criteria: readonly Criterion[]): number {
  return criteria.filter((c) => c.done).length;
}

export function canClose(item: WorkItem): boolean {
  return item.criteria.length > 0 && doneCount(item.criteria) === item.criteria.length;
}
