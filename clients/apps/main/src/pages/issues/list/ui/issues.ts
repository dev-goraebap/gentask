import { doneCount, ITEM_STATES, type ItemKind, type WorkItem } from '@/entities/issue';

export type IssueView = 'list' | 'tree' | 'board';

export type SortDirection = 'asc' | 'desc';

export type SortKey = 'id' | 'state' | 'progress';

export const COLUMN_WIDTH = 240;

export const KINDS: ItemKind[] = ['EPIC', 'STORY', 'TASK', 'BUG'];

export const KIND_LABEL: Record<ItemKind, string> = {
  EPIC: '에픽',
  STORY: '스토리',
  TASK: '태스크',
  BUG: '버그',
};

export const SORT_LABEL: Record<SortKey, string> = {
  id: '식별자 순',
  state: '상태 순',
  progress: '진행도 순',
};

export interface IssuesProps {
  readonly projectId: string;
  readonly items: readonly WorkItem[];
  readonly view: IssueView;
  readonly onViewChange: (view: IssueView) => void;
  readonly onOpen: (id: string) => void;
}

export function compare(sort: SortKey, direction: SortDirection = sort === 'progress' ? 'desc' : 'asc') {
  const sign = direction === 'asc' ? 1 : -1;
  return (a: WorkItem, b: WorkItem) => {
    if (sort === 'id') {
      return sign * (Number(a.id.split('-')[1]) - Number(b.id.split('-')[1]));
    }
    if (sort === 'state') {
      return sign * (ITEM_STATES.indexOf(a.state) - ITEM_STATES.indexOf(b.state));
    }
    return sign * (ratio(a) - ratio(b));
  };
}

export function ratio(item: WorkItem): number {
  if (item.criteria.length === 0) return 0;
  return doneCount(item.criteria) / item.criteria.length;
}

export interface ViewProps {
  readonly items: readonly WorkItem[];
  readonly onOpen: (id: string) => void;
}
